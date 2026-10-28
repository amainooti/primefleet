"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { generateManageKey, generateSlug, hashKey } from "@/lib/portal/keys";
import { loadPortalForManage, portalPaths } from "@/lib/portal/access";
import { collectUploads, parsePortalForm, type UploadRow } from "@/lib/portal/validation";
import { rateLimited } from "@/lib/portal/ratelimit";
import {
  MAX_DOC_ROWS_PER_REQUEST,
  MAX_FILES_PER_PORTAL,
  MAX_FILES_PER_REQUEST,
  STEP_STATUSES,
} from "@/lib/portal/constants";
import { PortalStorageError, deletePortalFile, savePortalFile } from "@/lib/portal/storage";

export type PortalFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

type DocData = {
  kind: string;
  note: string | null;
  fileName: string | null;
  storedName: string | null;
  mimeType: string | null;
  size: number | null;
};

/** Saves the files of every row and returns DB-ready document data (listed rows have null file fields). */
async function saveRows(rows: UploadRow[]): Promise<{ docs: DocData[]; error?: string }> {
  if (rows.length > MAX_DOC_ROWS_PER_REQUEST) {
    return { docs: [], error: `You can add up to ${MAX_DOC_ROWS_PER_REQUEST} documents at a time.` };
  }
  if (rows.filter((r) => r.file).length > MAX_FILES_PER_REQUEST) {
    return {
      docs: [],
      error: `You can attach up to ${MAX_FILES_PER_REQUEST} files at a time. Add more later from the dashboard.`,
    };
  }
  const docs: DocData[] = [];
  try {
    for (const r of rows) {
      if (r.file) {
        const s = await savePortalFile(r.file);
        docs.push({
          kind: r.kind,
          note: r.note ?? null,
          fileName: s.fileName,
          storedName: s.storedName,
          mimeType: s.mimeType,
          size: s.size,
        });
      } else {
        docs.push({
          kind: r.kind,
          note: r.note ?? null,
          fileName: null,
          storedName: null,
          mimeType: null,
          size: null,
        });
      }
    }
    return { docs };
  } catch (e) {
    await cleanup(docs);
    return {
      docs: [],
      error: e instanceof PortalStorageError ? e.message : "Could not save the uploaded files.",
    };
  }
}

async function cleanup(docs: DocData[]) {
  await Promise.all(
    docs.filter((d) => d.storedName).map((d) => deletePortalFile(d.storedName!))
  );
}

/* ------------------------------ create ------------------------------ */

export async function createPortal(
  _prev: PortalFormState,
  formData: FormData
): Promise<PortalFormState> {
  // Honeypot: real users never fill this hidden field.
  if (formData.get("website")) return { error: "Something went wrong. Please try again." };

  if (await rateLimited("portal-create", 5, 60 * 60 * 1000)) {
    return { error: "Too many portals created from this connection. Please try again later." };
  }

  const parsed = parsePortalForm(formData);
  if (!parsed.ok) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  }

  const { docs, error } = await saveRows(collectUploads(formData));
  if (error) return { error };

  const slug = generateSlug();
  const key = generateManageKey();

  try {
    await prisma.portal.create({
      data: {
        slug,
        manageKeyHash: hashKey(key),
        ...parsed.data,
        steps: { create: parsed.steps.map((s, i) => ({ ...s, sortOrder: i })) },
        charges: { create: parsed.charges.map((c, i) => ({ ...c, sortOrder: i })) },
        documents: { create: docs },
      },
    });
  } catch {
    await cleanup(docs);
    return { error: "Could not create the portal. Please try again." };
  }

  redirect(`${portalPaths(slug, key).manage}&created=1`);
}

/* ------------------------------ update ------------------------------ */

export async function updatePortal(
  slug: string,
  key: string,
  _prev: PortalFormState,
  formData: FormData
): Promise<PortalFormState> {
  const portal = await loadPortalForManage(slug, key);
  if (!portal) return { error: "This manage link is no longer valid." };

  if (await rateLimited("portal-update", 30, 60 * 60 * 1000)) {
    return { error: "Too many changes. Please try again later." };
  }

  const parsed = parsePortalForm(formData);
  if (!parsed.ok) {
    return { error: "Please fix the highlighted fields.", fieldErrors: parsed.fieldErrors };
  }

  const rows = collectUploads(formData);
  if (portal.documents.length + rows.length > MAX_FILES_PER_PORTAL) {
    return { error: `A portal can hold up to ${MAX_FILES_PER_PORTAL} documents.` };
  }
  const { docs, error } = await saveRows(rows);
  if (error) return { error };

  try {
    await prisma.$transaction([
      prisma.portalStep.deleteMany({ where: { portalId: portal.id } }),
      prisma.portalCharge.deleteMany({ where: { portalId: portal.id } }),
      prisma.portal.update({
        where: { id: portal.id },
        data: {
          ...parsed.data,
          steps: { create: parsed.steps.map((s, i) => ({ ...s, sortOrder: i })) },
          charges: { create: parsed.charges.map((c, i) => ({ ...c, sortOrder: i })) },
          documents: { create: docs },
        },
      }),
    ]);
  } catch {
    await cleanup(docs);
    return { error: "Could not save your changes. Please try again." };
  }

  redirect(portalPaths(slug, key).manage);
}

/* --------------------- dashboard (manage-mode) actions --------------------- */

export async function uploadDocument(
  slug: string,
  key: string,
  _prev: PortalFormState,
  formData: FormData
): Promise<PortalFormState> {
  const portal = await loadPortalForManage(slug, key);
  if (!portal) return { error: "This manage link is no longer valid." };

  if (await rateLimited("portal-upload", 20, 60 * 60 * 1000)) {
    return { error: "Too many uploads. Please try again later." };
  }

  const rows = collectUploads(formData).slice(0, 1);
  if (rows.length === 0) return { error: "Enter a document name or choose a file." };
  if (portal.documents.length + rows.length > MAX_FILES_PER_PORTAL) {
    return { error: `A portal can hold up to ${MAX_FILES_PER_PORTAL} documents.` };
  }

  const { docs, error } = await saveRows(rows);
  if (error) return { error };

  try {
    await prisma.portalDocument.createMany({
      data: docs.map((d) => ({ ...d, portalId: portal.id })),
    });
  } catch {
    await cleanup(docs);
    return { error: "Could not save the upload. Please try again." };
  }

  revalidatePath(`/portal/${slug}`);
  return {};
}

/** Attach (or replace) the file of an existing listed document. */
export async function attachFile(
  slug: string,
  key: string,
  docId: string,
  _prev: PortalFormState,
  formData: FormData
): Promise<PortalFormState> {
  const portal = await loadPortalForManage(slug, key);
  if (!portal) return { error: "This manage link is no longer valid." };
  const doc = portal.documents.find((d) => d.id === docId);
  if (!doc) return { error: "Document not found." };

  if (await rateLimited("portal-upload", 20, 60 * 60 * 1000)) {
    return { error: "Too many uploads. Please try again later." };
  }

  const file = formData.get("doc_file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file." };

  let saved;
  try {
    saved = await savePortalFile(file);
  } catch (e) {
    return {
      error: e instanceof PortalStorageError ? e.message : "Could not save the uploaded file.",
    };
  }

  try {
    await prisma.portalDocument.update({
      where: { id: doc.id },
      data: {
        fileName: saved.fileName,
        storedName: saved.storedName,
        mimeType: saved.mimeType,
        size: saved.size,
      },
    });
  } catch {
    await deletePortalFile(saved.storedName);
    return { error: "Could not save the upload. Please try again." };
  }
  if (doc.storedName) await deletePortalFile(doc.storedName);

  revalidatePath(`/portal/${slug}`);
  return {};
}

export async function deleteDocument(slug: string, key: string, docId: string) {
  const portal = await loadPortalForManage(slug, key);
  if (!portal) return;
  const doc = portal.documents.find((d) => d.id === docId);
  if (!doc) return;
  await prisma.portalDocument.delete({ where: { id: doc.id } });
  if (doc.storedName) await deletePortalFile(doc.storedName);
  revalidatePath(`/portal/${slug}`);
}

export async function setStepStatus(
  slug: string,
  key: string,
  stepId: string,
  status: string
) {
  const portal = await loadPortalForManage(slug, key);
  if (!portal) return;
  if (!(STEP_STATUSES as readonly string[]).includes(status)) return;
  if (!portal.steps.some((s) => s.id === stepId)) return;
  await prisma.portalStep.update({
    where: { id: stepId },
    data: { status: status as (typeof STEP_STATUSES)[number] },
  });
  revalidatePath(`/portal/${slug}`);
}

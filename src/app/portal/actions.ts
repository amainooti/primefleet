"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { generateManageKey, generateSlug, hashKey } from "@/lib/portal/keys";
import { loadPortalForManage, portalPaths } from "@/lib/portal/access";
import { collectUploads, parsePortalForm } from "@/lib/portal/validation";
import { rateLimited } from "@/lib/portal/ratelimit";
import {
  MAX_FILES_PER_PORTAL,
  MAX_FILES_PER_REQUEST,
  PortalStorageError,
  deletePortalFile,
  savePortalFile,
} from "@/lib/portal/storage";
import { STEP_STATUSES } from "@/lib/portal/constants";

export type PortalFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

type SavedFile = Awaited<ReturnType<typeof savePortalFile>> & { kind: string };

async function saveUploads(
  uploads: { kind: string; file: File }[]
): Promise<{ saved: SavedFile[]; error?: string }> {
  if (uploads.length > MAX_FILES_PER_REQUEST) {
    return {
      saved: [],
      error: `You can attach up to ${MAX_FILES_PER_REQUEST} files at a time. Add more later from the dashboard.`,
    };
  }
  const saved: SavedFile[] = [];
  try {
    for (const u of uploads) {
      saved.push({ ...(await savePortalFile(u.file)), kind: u.kind });
    }
    return { saved };
  } catch (e) {
    await Promise.all(saved.map((s) => deletePortalFile(s.storedName)));
    return {
      saved: [],
      error: e instanceof PortalStorageError ? e.message : "Could not save the uploaded files.",
    };
  }
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

  const { saved, error } = await saveUploads(collectUploads(formData));
  if (error) return { error };

  const slug = generateSlug();
  const key = generateManageKey();

  try {
    await prisma.portal.create({
      data: {
        slug,
        manageKeyHash: hashKey(key),
        ...parsed.data,
        steps: {
          create: parsed.steps.map((s, i) => ({ ...s, sortOrder: i })),
        },
        charges: {
          create: parsed.charges.map((c, i) => ({ ...c, sortOrder: i })),
        },
        documents: {
          create: saved.map((f) => ({
            kind: f.kind,
            fileName: f.fileName,
            storedName: f.storedName,
            mimeType: f.mimeType,
            size: f.size,
          })),
        },
      },
    });
  } catch {
    await Promise.all(saved.map((s) => deletePortalFile(s.storedName)));
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

  const uploads = collectUploads(formData);
  if (portal.documents.length + uploads.length > MAX_FILES_PER_PORTAL) {
    return { error: `A portal can hold up to ${MAX_FILES_PER_PORTAL} documents.` };
  }
  const { saved, error } = await saveUploads(uploads);
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
          documents: {
            create: saved.map((f) => ({
              kind: f.kind,
              fileName: f.fileName,
              storedName: f.storedName,
              mimeType: f.mimeType,
              size: f.size,
            })),
          },
        },
      }),
    ]);
  } catch {
    await Promise.all(saved.map((s) => deletePortalFile(s.storedName)));
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

  const uploads = collectUploads(formData);
  if (uploads.length === 0) return { error: "Choose a file to upload." };
  if (portal.documents.length + uploads.length > MAX_FILES_PER_PORTAL) {
    return { error: `A portal can hold up to ${MAX_FILES_PER_PORTAL} documents.` };
  }

  const { saved, error } = await saveUploads(uploads);
  if (error) return { error };

  try {
    await prisma.portalDocument.createMany({
      data: saved.map((f) => ({
        portalId: portal.id,
        kind: f.kind,
        fileName: f.fileName,
        storedName: f.storedName,
        mimeType: f.mimeType,
        size: f.size,
      })),
    });
  } catch {
    await Promise.all(saved.map((s) => deletePortalFile(s.storedName)));
    return { error: "Could not save the upload. Please try again." };
  }

  revalidatePath(`/portal/${slug}`);
  return {};
}

export async function deleteDocument(slug: string, key: string, docId: string) {
  const portal = await loadPortalForManage(slug, key);
  if (!portal) return;
  const doc = portal.documents.find((d) => d.id === docId);
  if (!doc) return;
  await prisma.portalDocument.delete({ where: { id: doc.id } });
  await deletePortalFile(doc.storedName);
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

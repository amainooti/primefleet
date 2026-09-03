"use client";

import { useState } from "react";
import { deleteTruckImage, setPrimaryTruckImage } from "@/app/admin/trucks/images-actions";
import { Upload, ImageIcon, Star, Trash2, Plus, X } from "lucide-react";

type Spec = { group: string; name: string; value: string };
type ExistingImage = { id: string; url: string; alt: string | null; isPrimary: boolean };

export function TruckForm({
  categories,
  action,
  defaultValues,
  truckId,
}: {
  categories: { id: string; name: string }[];
  action: (formData: FormData) => void;
  defaultValues?: any;
  truckId?: string;
}) {
  const [specs, setSpecs] = useState<Spec[]>(defaultValues?.specifications ?? []);
  const existingImages: ExistingImage[] = defaultValues?.images ?? [];
  const [pendingCount, setPendingCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const addSpec = () => setSpecs([...specs, { group: "", name: "", value: "" }]);
  const updateSpec = (i: number, field: keyof Spec, value: string) =>
    setSpecs(specs.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  const removeSpec = (i: number) => setSpecs(specs.filter((_, idx) => idx !== i));

  return (
    <form action={action} className="space-y-6 max-w-2xl">
      <input type="hidden" name="specifications" value={JSON.stringify(specs)} />

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Slug</span>
          <input name="slug" defaultValue={defaultValues?.slug} required className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Stock Number</span>
          <input name="stockNumber" defaultValue={defaultValues?.stockNumber} required className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Year</span>
          <input name="year" type="number" defaultValue={defaultValues?.year} required className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Manufacturer</span>
          <input name="manufacturer" defaultValue={defaultValues?.manufacturer} required className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Model</span>
          <input name="model" defaultValue={defaultValues?.model} required className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block col-span-2">
          <span className="text-sm font-medium">Title</span>
          <input name="title" defaultValue={defaultValues?.title} required className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea name="description" defaultValue={defaultValues?.description} rows={4} className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Category</span>
          <select name="categoryId" defaultValue={defaultValues?.categoryId} required className="w-full border rounded px-3 py-2">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Condition</span>
          <select name="condition" defaultValue={defaultValues?.condition ?? "USED"} required className="w-full border rounded px-3 py-2">
            <option value="NEW">New</option>
            <option value="USED">Used</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Status</span>
          <select name="status" defaultValue={defaultValues?.status ?? "AVAILABLE"} required className="w-full border rounded px-3 py-2">
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="RENTED">Rented</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Rate</span>
          <input name="rateDisplay" placeholder='e.g. "$450/day"' defaultValue={defaultValues?.rateDisplay} required className="w-full border rounded px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Location</span>
          <input name="location" defaultValue={defaultValues?.location} className="w-full border rounded px-3 py-2" />
        </label>
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Photos</span>
        </div>

        {truckId && existingImages.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-3">
            {existingImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />

                {img.isPrimary && (
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                    <Star className="h-2.5 w-2.5 fill-[#D4AF37]" />
                    Primary
                  </span>
                )}

                {/* Hover action overlay */}
                <div className="absolute inset-0 flex items-end justify-center gap-1.5 bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {!img.isPrimary && (
                    <form action={setPrimaryTruckImage.bind(null, truckId, img.id)}>
                      <button
                        type="submit"
                        title="Set as primary"
                        className="flex items-center justify-center rounded-full bg-white/90 p-1.5 text-black hover:bg-[#D4AF37] transition-colors"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  )}
                  <form action={deleteTruckImage.bind(null, truckId, img.id)}>
                    <button
                      type="submit"
                      title="Remove image"
                      className="flex items-center justify-center rounded-full bg-white/90 p-1.5 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dropzone-style upload */}
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => setIsDragOver(false)}
          className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
            isDragOver ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-300 hover:border-gray-400 bg-gray-50"
          }`}
        >
          <Upload className="h-6 w-6 text-gray-400" />
          <div className="text-sm text-gray-700">
            <span className="font-medium text-black underline">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-gray-500">JPEG, PNG, WEBP, or AVIF — up to 5MB each</p>
          {pendingCount > 0 && (
            <p className="text-xs font-medium text-[#8a7420]">{pendingCount} file{pendingCount > 1 ? "s" : ""} selected</p>
          )}
          <input
            type="file"
            name="images"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => setPendingCount(e.target.files?.length ?? 0)}
          />
        </label>
      </div>

      {/* Specifications */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Specifications</h2>
          <button
            type="button"
            onClick={addSpec}
            className="flex items-center gap-1 text-sm font-medium text-black hover:text-[#8a7420]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add spec
          </button>
        </div>
        <div className="space-y-2 mt-2">
          {specs.length === 0 && (
            <p className="text-sm text-gray-400 italic">No specifications yet.</p>
          )}
          {specs.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
              <input placeholder="Group" value={s.group} onChange={(e) => updateSpec(i, "group", e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
              <input placeholder="Name" value={s.name} onChange={(e) => updateSpec(i, "name", e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
              <input placeholder="Value" value={s.value} onChange={(e) => updateSpec(i, "value", e.target.value)} className="border rounded px-2 py-1.5 text-sm" />
              <button
                type="button"
                onClick={() => removeSpec(i)}
                title="Remove spec"
                className="flex items-center justify-center rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="rounded bg-black px-4 py-2 text-[#D4AF37] font-semibold hover:bg-gray-900 transition-colors">
        Save
      </button>
    </form>
  );
}
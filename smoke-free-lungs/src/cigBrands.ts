export type BrandProductType = "cigarette" | "vape";

type BrandCatalogBase = {
  id: string;
  name: string;
  productType: BrandProductType;
  category: string;
  manufacturer: string;
  sourceNote: string;
  nicotineMg: number | null;
  tarMg: number | null;
};

export type CigaretteBrand = BrandCatalogBase & {
  productType: "cigarette";
  nicotineMg: number;
  tarMg: number;
};

export type VapeBrand = BrandCatalogBase & {
  productType: "vape";
};

export type BrandCatalogEntry = CigaretteBrand | VapeBrand;

export type BrandCatalogResult = {
  brands: BrandCatalogEntry[];
  source: "remote" | "fallback";
};

export const DEFAULT_BRAND_ID = "average-us-king";

const LOCAL_CIGARETTE_BRANDS: CigaretteBrand[] = [
  { id: "average-us-king", name: "Average US king-size (reference)", productType: "cigarette", nicotineMg: 1.0, tarMg: 12, category: "reference", manufacturer: "Reference profile", sourceNote: "Fallback local catalog" },
  { id: "marlboro-red", name: "Marlboro Red", productType: "cigarette", nicotineMg: 1.0, tarMg: 12, category: "full-flavor", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "marlboro-gold", name: "Marlboro Gold", productType: "cigarette", nicotineMg: 0.7, tarMg: 8, category: "light", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "marlboro-menthol", name: "Marlboro Menthol", productType: "cigarette", nicotineMg: 0.9, tarMg: 11, category: "menthol", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "camel-filters", name: "Camel Filters", productType: "cigarette", nicotineMg: 0.8, tarMg: 11, category: "full-flavor", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "camel-blue", name: "Camel Blue", productType: "cigarette", nicotineMg: 0.7, tarMg: 8, category: "light", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "camel-crush", name: "Camel Crush", productType: "cigarette", nicotineMg: 0.9, tarMg: 11, category: "menthol", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "newport-menthol", name: "Newport Menthol", productType: "cigarette", nicotineMg: 1.1, tarMg: 13, category: "menthol", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "newport-gold", name: "Newport Gold", productType: "cigarette", nicotineMg: 0.8, tarMg: 9, category: "menthol", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "parliament-full-flavor", name: "Parliament Full Flavor", productType: "cigarette", nicotineMg: 0.9, tarMg: 10, category: "full-flavor", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "parliament-lights", name: "Parliament Lights", productType: "cigarette", nicotineMg: 0.7, tarMg: 8, category: "light", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "pall-mall-red", name: "Pall Mall Red", productType: "cigarette", nicotineMg: 1.2, tarMg: 16, category: "full-flavor", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "pall-mall-blue", name: "Pall Mall Blue", productType: "cigarette", nicotineMg: 0.8, tarMg: 10, category: "light", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "american-spirit-original", name: "American Spirit Original", productType: "cigarette", nicotineMg: 1.2, tarMg: 13, category: "full-flavor", manufacturer: "Santa Fe Natural Tobacco", sourceNote: "Fallback local catalog" },
  { id: "american-spirit-light-blue", name: "American Spirit Light Blue", productType: "cigarette", nicotineMg: 0.8, tarMg: 9, category: "light", manufacturer: "Santa Fe Natural Tobacco", sourceNote: "Fallback local catalog" },
  { id: "winston-red", name: "Winston Red", productType: "cigarette", nicotineMg: 0.9, tarMg: 12, category: "full-flavor", manufacturer: "ITG Brands", sourceNote: "Fallback local catalog" },
  { id: "winston-gold", name: "Winston Gold", productType: "cigarette", nicotineMg: 0.7, tarMg: 8, category: "light", manufacturer: "ITG Brands", sourceNote: "Fallback local catalog" },
  { id: "lucky-strike-original-red", name: "Lucky Strike Original Red", productType: "cigarette", nicotineMg: 1.1, tarMg: 13, category: "full-flavor", manufacturer: "British American Tobacco", sourceNote: "Fallback local catalog" },
  { id: "kool-filter-kings", name: "Kool Filter Kings", productType: "cigarette", nicotineMg: 0.9, tarMg: 12, category: "menthol", manufacturer: "ITG Brands", sourceNote: "Fallback local catalog" },
  { id: "salem-menthol", name: "Salem Menthol", productType: "cigarette", nicotineMg: 0.8, tarMg: 10, category: "menthol", manufacturer: "ITG Brands", sourceNote: "Fallback local catalog" },
  { id: "virginia-slims-menthol", name: "Virginia Slims Menthol", productType: "cigarette", nicotineMg: 0.7, tarMg: 9, category: "menthol", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "misty-blue", name: "Misty Blue", productType: "cigarette", nicotineMg: 0.6, tarMg: 7, category: "light", manufacturer: "Liggett Group", sourceNote: "Fallback local catalog" },
  { id: "l-m-red", name: "L&M Red", productType: "cigarette", nicotineMg: 0.9, tarMg: 11, category: "full-flavor", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "l-m-blue", name: "L&M Blue", productType: "cigarette", nicotineMg: 0.7, tarMg: 8, category: "light", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "chesterfield-red", name: "Chesterfield Red", productType: "cigarette", nicotineMg: 1.0, tarMg: 12, category: "full-flavor", manufacturer: "Liggett Group", sourceNote: "Fallback local catalog" },
  { id: "basic-full-flavor", name: "Basic Full Flavor", productType: "cigarette", nicotineMg: 0.9, tarMg: 12, category: "full-flavor", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "basic-light", name: "Basic Light", productType: "cigarette", nicotineMg: 0.7, tarMg: 8, category: "light", manufacturer: "Philip Morris", sourceNote: "Fallback local catalog" },
  { id: "doral-full-flavor", name: "Doral Full Flavor", productType: "cigarette", nicotineMg: 0.9, tarMg: 11, category: "full-flavor", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "doral-light", name: "Doral Light", productType: "cigarette", nicotineMg: 0.7, tarMg: 8, category: "light", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "kent-fhd", name: "Kent FHD", productType: "cigarette", nicotineMg: 0.8, tarMg: 10, category: "full-flavor", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "kent-lights", name: "Kent Lights", productType: "cigarette", nicotineMg: 0.6, tarMg: 7, category: "light", manufacturer: "R.J. Reynolds", sourceNote: "Fallback local catalog" },
  { id: "305s-red", name: "305s Red", productType: "cigarette", nicotineMg: 1.0, tarMg: 12, category: "full-flavor", manufacturer: "Dosal Tobacco", sourceNote: "Fallback local catalog" },
  { id: "305s-gold", name: "305s Gold", productType: "cigarette", nicotineMg: 0.7, tarMg: 8, category: "light", manufacturer: "Dosal Tobacco", sourceNote: "Fallback local catalog" },
  { id: "montego-red", name: "Montego Red", productType: "cigarette", nicotineMg: 0.9, tarMg: 11, category: "full-flavor", manufacturer: "Liggett Group", sourceNote: "Fallback local catalog" },
  { id: "montego-blue", name: "Montego Blue", productType: "cigarette", nicotineMg: 0.7, tarMg: 8, category: "light", manufacturer: "Liggett Group", sourceNote: "Fallback local catalog" },
];

const LOCAL_VAPE_BRANDS: VapeBrand[] = [
  { id: "juul-virginia-tobacco", name: "JUUL Virginia Tobacco", productType: "vape", nicotineMg: 5, tarMg: null, category: "pod", manufacturer: "JUUL Labs", sourceNote: "Fallback local catalog" },
  { id: "juul-menthol", name: "JUUL Menthol", productType: "vape", nicotineMg: 5, tarMg: null, category: "pod", manufacturer: "JUUL Labs", sourceNote: "Fallback local catalog" },
  { id: "vuse-alto-rich-tobacco", name: "Vuse Alto Rich Tobacco", productType: "vape", nicotineMg: 5, tarMg: null, category: "pod", manufacturer: "R.J. Reynolds Vapor", sourceNote: "Fallback local catalog" },
  { id: "vuse-alto-menthol", name: "Vuse Alto Menthol", productType: "vape", nicotineMg: 5, tarMg: null, category: "pod", manufacturer: "R.J. Reynolds Vapor", sourceNote: "Fallback local catalog" },
  { id: "njoy-daily-rich-tobacco", name: "NJOY Daily Rich Tobacco", productType: "vape", nicotineMg: 6, tarMg: null, category: "disposable", manufacturer: "NJOY", sourceNote: "Fallback local catalog" },
  { id: "blu-tobacco", name: "blu Tobacco", productType: "vape", nicotineMg: 2.4, tarMg: null, category: "pod", manufacturer: "Fontem Ventures", sourceNote: "Fallback local catalog" },
  { id: "elf-bar-bc5000-tobacco", name: "Elf Bar BC5000 Tobacco", productType: "vape", nicotineMg: 5, tarMg: null, category: "disposable", manufacturer: "Elf Bar", sourceNote: "Fallback local catalog" },
  { id: "smok-novo-rich-tobacco", name: "SMOK Novo Rich Tobacco", productType: "vape", nicotineMg: 5, tarMg: null, category: "pod", manufacturer: "SMOK", sourceNote: "Fallback local catalog" },
];

const LOCAL_BRAND_CATALOG: BrandCatalogEntry[] = [...LOCAL_CIGARETTE_BRANDS, ...LOCAL_VAPE_BRANDS];

let runtimeBrandCatalog: BrandCatalogEntry[] = LOCAL_BRAND_CATALOG;

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sortCatalog(brands: BrandCatalogEntry[]): BrandCatalogEntry[] {
  return [...brands].sort((a, b) => {
    if (a.productType !== b.productType) return a.productType.localeCompare(b.productType);
    return a.name.localeCompare(b.name);
  });
}

function mergeCatalog(remoteBrands: BrandCatalogEntry[]): BrandCatalogEntry[] {
  const merged = new Map<string, BrandCatalogEntry>();
  for (const brand of LOCAL_BRAND_CATALOG) {
    merged.set(brand.id, brand);
  }
  for (const brand of remoteBrands) {
    merged.set(brand.id, brand);
  }
  return sortCatalog([...merged.values()]);
}

function normalizeRemoteBrand(value: unknown): BrandCatalogEntry | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const productType = normalizeText(record.productType);
  if (productType !== "cigarette" && productType !== "vape") return null;

  const id = normalizeText(record.id);
  const name = normalizeText(record.name);
  if (!id || !name) return null;

  const brandBase = {
    id,
    name,
    productType,
    category: normalizeText(record.category) || (productType === "cigarette" ? "reference" : "pod"),
    manufacturer: normalizeText(record.manufacturer) || "Unknown manufacturer",
    sourceNote: normalizeText(record.sourceNote) || "Remote catalog",
    nicotineMg: normalizeNumberOrNull(record.nicotineMg),
    tarMg: normalizeNumberOrNull(record.tarMg),
  };

  if (productType === "cigarette") {
    if (brandBase.nicotineMg == null || brandBase.tarMg == null) return null;
    return {
      ...brandBase,
      productType: "cigarette",
      nicotineMg: brandBase.nicotineMg,
      tarMg: brandBase.tarMg,
    };
  }

  return {
    ...brandBase,
    productType: "vape",
    tarMg: null,
  };
}

function parseBrandCatalogPayload(value: unknown): BrandCatalogEntry[] {
  const list = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).brands)
      ? (value as Record<string, unknown>).brands as unknown[]
      : [];

  return sortCatalog(
    list
      .map((entry) => normalizeRemoteBrand(entry))
      .filter((entry): entry is BrandCatalogEntry => entry != null),
  );
}

export function getBrandCatalog(): BrandCatalogEntry[] {
  return runtimeBrandCatalog;
}

export function getCigaretteBrands(): CigaretteBrand[] {
  return runtimeBrandCatalog.filter((brand): brand is CigaretteBrand => brand.productType === "cigarette");
}

export function getVapeBrands(): VapeBrand[] {
  return runtimeBrandCatalog.filter((brand): brand is VapeBrand => brand.productType === "vape");
}

export function getBrandById(id: string): CigaretteBrand | null {
  return getCigaretteBrands().find((brand) => brand.id === id) ?? null;
}

export function hydrateBrandCatalog(brands: BrandCatalogEntry[]): BrandCatalogEntry[] {
  runtimeBrandCatalog = mergeCatalog(brands);
  return runtimeBrandCatalog;
}

export async function loadBrandCatalog(): Promise<BrandCatalogResult> {
  const endpoint = import.meta.env.VITE_BRAND_CATALOG_ENDPOINT as string | undefined;
  if (!endpoint) {
    runtimeBrandCatalog = LOCAL_BRAND_CATALOG;
    return { brands: runtimeBrandCatalog, source: "fallback" };
  }

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Catalog request failed with ${response.status}.`);

    const payload = (await response.json()) as unknown;
    const parsed = parseBrandCatalogPayload(payload);
    if (parsed.length === 0) throw new Error("Catalog payload is empty.");

    runtimeBrandCatalog = mergeCatalog(parsed);
    return { brands: runtimeBrandCatalog, source: "remote" };
  } catch {
    runtimeBrandCatalog = LOCAL_BRAND_CATALOG;
    return { brands: runtimeBrandCatalog, source: "fallback" };
  }
}

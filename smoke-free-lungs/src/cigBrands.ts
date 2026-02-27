// src/cigBrands.ts
export type CigaretteBrand = {
  id: string;
  name: string;
  nicotineMg: number;
  tarMg: number;
  category: "full-flavor" | "light" | "menthol" | "reference";
  sourceNote: string;
};

export const DEFAULT_BRAND_ID = "average-us-king";

// Educational local dataset based on machine-yield style ranges from public reports.
export const CIGARETTE_BRANDS: CigaretteBrand[] = [
  { id: "average-us-king", name: "Average US king-size (reference)", nicotineMg: 1.0, tarMg: 12, category: "reference", sourceNote: "Reference profile" },
  { id: "marlboro-red", name: "Marlboro Red", nicotineMg: 1.0, tarMg: 12, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "marlboro-gold", name: "Marlboro Gold", nicotineMg: 0.7, tarMg: 8, category: "light", sourceNote: "Public machine-yield range" },
  { id: "marlboro-menthol", name: "Marlboro Menthol", nicotineMg: 0.9, tarMg: 11, category: "menthol", sourceNote: "Public machine-yield range" },
  { id: "camel-filters", name: "Camel Filters", nicotineMg: 0.8, tarMg: 11, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "camel-blue", name: "Camel Blue", nicotineMg: 0.7, tarMg: 8, category: "light", sourceNote: "Public machine-yield range" },
  { id: "camel-crush", name: "Camel Crush", nicotineMg: 0.9, tarMg: 11, category: "menthol", sourceNote: "Public machine-yield range" },
  { id: "newport-menthol", name: "Newport Menthol", nicotineMg: 1.1, tarMg: 13, category: "menthol", sourceNote: "Public machine-yield range" },
  { id: "newport-gold", name: "Newport Gold", nicotineMg: 0.8, tarMg: 9, category: "menthol", sourceNote: "Public machine-yield range" },
  { id: "parliament-full-flavor", name: "Parliament Full Flavor", nicotineMg: 0.9, tarMg: 10, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "parliament-lights", name: "Parliament Lights", nicotineMg: 0.7, tarMg: 8, category: "light", sourceNote: "Public machine-yield range" },
  { id: "pall-mall-red", name: "Pall Mall Red", nicotineMg: 1.2, tarMg: 16, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "pall-mall-blue", name: "Pall Mall Blue", nicotineMg: 0.8, tarMg: 10, category: "light", sourceNote: "Public machine-yield range" },
  { id: "american-spirit-original", name: "American Spirit Original", nicotineMg: 1.2, tarMg: 13, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "american-spirit-light-blue", name: "American Spirit Light Blue", nicotineMg: 0.8, tarMg: 9, category: "light", sourceNote: "Public machine-yield range" },
  { id: "winston-red", name: "Winston Red", nicotineMg: 0.9, tarMg: 12, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "winston-gold", name: "Winston Gold", nicotineMg: 0.7, tarMg: 8, category: "light", sourceNote: "Public machine-yield range" },
  { id: "lucky-strike-original-red", name: "Lucky Strike Original Red", nicotineMg: 1.1, tarMg: 13, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "kool-filter-kings", name: "Kool Filter Kings", nicotineMg: 0.9, tarMg: 12, category: "menthol", sourceNote: "Public machine-yield range" },
  { id: "salem-menthol", name: "Salem Menthol", nicotineMg: 0.8, tarMg: 10, category: "menthol", sourceNote: "Public machine-yield range" },
  { id: "virginia-slims-menthol", name: "Virginia Slims Menthol", nicotineMg: 0.7, tarMg: 9, category: "menthol", sourceNote: "Public machine-yield range" },
  { id: "misty-blue", name: "Misty Blue", nicotineMg: 0.6, tarMg: 7, category: "light", sourceNote: "Public machine-yield range" },
  { id: "l-m-red", name: "L&M Red", nicotineMg: 0.9, tarMg: 11, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "l-m-blue", name: "L&M Blue", nicotineMg: 0.7, tarMg: 8, category: "light", sourceNote: "Public machine-yield range" },
  { id: "chesterfield-red", name: "Chesterfield Red", nicotineMg: 1.0, tarMg: 12, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "basic-full-flavor", name: "Basic Full Flavor", nicotineMg: 0.9, tarMg: 12, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "basic-light", name: "Basic Light", nicotineMg: 0.7, tarMg: 8, category: "light", sourceNote: "Public machine-yield range" },
  { id: "doral-full-flavor", name: "Doral Full Flavor", nicotineMg: 0.9, tarMg: 11, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "doral-light", name: "Doral Light", nicotineMg: 0.7, tarMg: 8, category: "light", sourceNote: "Public machine-yield range" },
  { id: "kent-fhd", name: "Kent FHD", nicotineMg: 0.8, tarMg: 10, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "kent-lights", name: "Kent Lights", nicotineMg: 0.6, tarMg: 7, category: "light", sourceNote: "Public machine-yield range" },
  { id: "305s-red", name: "305s Red", nicotineMg: 1.0, tarMg: 12, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "305s-gold", name: "305s Gold", nicotineMg: 0.7, tarMg: 8, category: "light", sourceNote: "Public machine-yield range" },
  { id: "montego-red", name: "Montego Red", nicotineMg: 0.9, tarMg: 11, category: "full-flavor", sourceNote: "Public machine-yield range" },
  { id: "montego-blue", name: "Montego Blue", nicotineMg: 0.7, tarMg: 8, category: "light", sourceNote: "Public machine-yield range" },
];

export function getBrandById(id: string): CigaretteBrand {
  return CIGARETTE_BRANDS.find((brand) => brand.id === id) ?? CIGARETTE_BRANDS[0];
}
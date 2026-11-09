import {z} from 'zod';

/** Overrides for the traditional Qurra/qira'ah certificate artwork.
 * All fields are optional so old snapshots retain their precise SVG geometry.
 * Dimensions follow the original aspect ratios: never stretch lettering. */
export const qiraatHeadingSchema=z.object({
 basmalahWidthMm:z.number().min(15).max(80).optional(),
 basmalahGapMm:z.number().min(0).max(20).optional(),
 ijazahWidthMm:z.number().min(55).max(145).optional(),
 ijazahOffsetMm:z.number().min(-8).max(8).optional(),
 riwayahHeightMm:z.number().min(5).max(16).optional(),
 riwayahGapMm:z.number().min(0).max(20).optional(),
 riwayahOffsetMm:z.number().min(-8).max(8).optional(),
 afterGapMm:z.number().min(0).max(20).optional(),
});
export type QiraatHeadingSettings=z.infer<typeof qiraatHeadingSchema>;
export const DEFAULT_QIRAAT_HEADING:Readonly<QiraatHeadingSettings> = Object.freeze({
 basmalahWidthMm:34.18,basmalahGapMm:3,ijazahWidthMm:98.0244,
 ijazahOffsetMm:0,riwayahHeightMm:8.445,riwayahGapMm:2,
 riwayahOffsetMm:0,afterGapMm:0,
});

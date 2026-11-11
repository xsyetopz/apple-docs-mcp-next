/**
 * Apple's DocC JSON, fetched and typed. The check is that the answer is a JSON object: the types come from Swift-DocC's
 * specs, and each reader treats every field as optional.
 */
import { z } from "zod";

import { httpClient, type RequestOptions } from "../core/http-client.ts";
import type { RenderIndex, RenderNode } from "../types/docc.ts";

const isJsonObject = (value: unknown): boolean =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const renderNode = z.custom<RenderNode>(
	isJsonObject,
	"Apple answered with something other than a documentation page",
);
const renderIndex = z.custom<RenderIndex>(
	isJsonObject,
	"Apple answered with something other than a navigator index",
);

/** A documentation page's JSON */
export const fetchRenderNode = async (
	url: string,
	options?: RequestOptions,
): Promise<RenderNode> =>
	renderNode.parse(await httpClient.getJson(url, options));

/** A navigator index's JSON */
export const fetchRenderIndex = async (
	url: string,
	options?: RequestOptions,
): Promise<RenderIndex> =>
	renderIndex.parse(await httpClient.getJson(url, options));

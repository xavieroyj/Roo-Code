import type { ModelInfo, ModelRecord } from "@roo-code/types"

import { DEFAULT_HEADERS } from "../constants"

const FIRMWARE_BASE_URL = "https://app.firmware.ai/api/v1"

/**
 * Fetches available models from the Firmware.ai API
 *
 * @param apiKey The API key for the Firmware.ai provider
 * @returns A promise that resolves to a record of model IDs to model info
 * @throws Will throw an error if the request fails or the response is not as expected.
 */
export async function getFirmwareModels(apiKey?: string): Promise<ModelRecord> {
	const url = `${FIRMWARE_BASE_URL}/models`

	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...DEFAULT_HEADERS,
		}

		if (apiKey) {
			headers["Authorization"] = `Bearer ${apiKey}`
		}

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 10000)

		try {
			const response = await fetch(url, {
				headers,
				signal: controller.signal,
			})

			if (!response.ok) {
				let errorBody = ""
				try {
					errorBody = await response.text()
				} catch {
					errorBody = "(unable to read response body)"
				}

				console.error(`[getFirmwareModels] HTTP error:`, {
					status: response.status,
					statusText: response.statusText,
					url,
					body: errorBody,
				})

				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}

			const data = await response.json()
			const models: ModelRecord = {}

			// OpenAI-compatible /models endpoint returns { data: [...] }
			if (!data.data || !Array.isArray(data.data)) {
				console.error("[getFirmwareModels] Unexpected response format:", data)
				throw new Error("Failed to fetch Firmware models: Unexpected response format.")
			}

			for (const model of data.data) {
				const modelId = model.id

				if (!modelId) continue

				// Extract model capabilities from the API response
				// Firmware.ai returns OpenAI-compatible model info with additional metadata
				const modelInfo: ModelInfo = {
					maxTokens: model.max_tokens ?? model.max_output_tokens ?? 8192,
					contextWindow: model.context_window ?? model.context_length ?? 128000,
					supportsImages: model.supports_vision ?? model.capabilities?.vision ?? false,
					supportsPromptCache: model.supports_prompt_cache ?? false,
					inputPrice: model.pricing?.input ?? model.input_price ?? 0,
					outputPrice: model.pricing?.output ?? model.output_price ?? 0,
					description: model.description ?? model.name ?? modelId,
				}

				// Add optional fields if available
				if (model.supports_reasoning || model.capabilities?.reasoning) {
					modelInfo.supportsReasoningEffort = true
				}

				if (model.default_temperature !== undefined) {
					modelInfo.defaultTemperature = model.default_temperature
				}

				models[modelId] = modelInfo
			}

			return models
		} finally {
			clearTimeout(timeoutId)
		}
	} catch (error: any) {
		console.error("[getFirmwareModels] Error fetching Firmware models:", {
			message: error.message || String(error),
			name: error.name,
			url,
			hasApiKey: Boolean(apiKey),
		})

		if (error.name === "AbortError") {
			throw new Error("Failed to fetch Firmware models: Request timed out after 10 seconds.")
		}

		if (error.message?.includes("HTTP")) {
			throw new Error(`Failed to fetch Firmware models: ${error.message}. Check API key.`)
		}

		if (error instanceof TypeError) {
			throw new Error("Failed to fetch Firmware models: No response from server. Check network connection.")
		}

		throw new Error(`Failed to fetch Firmware models: ${error.message || "An unknown error occurred."}`)
	}
}

export interface FirmwareQuotaResponse {
	windowUsed: number // 0 to 1 scale (1 = limit reached)
	windowReset: string | null // ISO timestamp when window quota resets, null if window hasn't started
	weeklyUsed: number // 0 to 1 scale (1 = limit reached)
	weeklyReset: string | null // ISO timestamp when weekly quota resets
	windowResetsRemaining: number
}

/**
 * Fetches quota information from the Firmware.ai API
 *
 * Response format:
 * {
 *   "windowUsed": 0.0008,
 *   "windowReset": "2026-02-05T09:42:38.915Z",
 *   "weeklyUsed": 0.0002,
 *   "weeklyReset": "2026-02-12T00:00:00.000Z",
 *   "windowResetsRemaining": 2
 * }
 *
 * @param apiKey The API key for the Firmware.ai provider
 * @returns A promise that resolves to quota information
 * @throws Will throw an error if the request fails
 */
export async function getFirmwareQuota(apiKey: string): Promise<FirmwareQuotaResponse> {
	const url = `${FIRMWARE_BASE_URL}/quota`

	try {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...DEFAULT_HEADERS,
			Authorization: `Bearer ${apiKey}`,
		}

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 10000)

		try {
			const response = await fetch(url, {
				headers,
				signal: controller.signal,
			})

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}

			const data = await response.json()

			return {
				windowUsed: data.windowUsed ?? 0,
				windowReset: data.windowReset ?? null,
				weeklyUsed: data.weeklyUsed ?? 0,
				weeklyReset: data.weeklyReset ?? null,
				windowResetsRemaining: typeof data.windowResetsRemaining === "number" ? data.windowResetsRemaining : 0,
			}
		} finally {
			clearTimeout(timeoutId)
		}
	} catch (error: any) {
		console.error("[getFirmwareQuota] Error fetching Firmware quota:", error.message)
		throw new Error(`Failed to fetch Firmware quota: ${error.message || "An unknown error occurred."}`)
	}
}

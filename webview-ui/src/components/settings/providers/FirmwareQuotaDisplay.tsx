import { Progress } from "@/components/ui/progress"
import { useFirmwareQuota } from "@/components/ui/hooks/useFirmwareQuota"

const formatTimeUntilReset = (ms: number): string => {
	if (ms <= 0) return "resetting..."
	const hours = Math.floor(ms / (1000 * 60 * 60))
	const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
	if (hours > 0) return `${hours}h ${minutes}m`
	return `${minutes}m`
}

const formatDaysHoursUntilReset = (ms: number): string => {
	if (ms <= 0) return "resetting..."
	const days = Math.floor(ms / (1000 * 60 * 60 * 24))
	const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
	if (days > 0) return `${days}d ${hours}h`
	return `${hours}h`
}

const formatResetText = (reset: string | null): string => {
	if (!reset) return ""
	const resetDate = new Date(reset)
	const now = new Date()
	const msUntilReset = resetDate.getTime() - now.getTime()
	return `Resets in ${formatTimeUntilReset(msUntilReset)}`
}

const formatWeeklyResetText = (reset: string | null): string => {
	if (!reset) return ""
	const resetDate = new Date(reset)
	const now = new Date()
	const msUntilReset = resetDate.getTime() - now.getTime()
	return `Resets in ${formatDaysHoursUntilReset(msUntilReset)}`
}

const formatResetsRemainingText = (remaining: number): string => {
	if (!Number.isFinite(remaining)) return ""
	const label = remaining === 1 ? "reset" : "resets"
	return `${remaining} ${label} left`
}

const formatMetaText = (...parts: Array<string | null | undefined>): string =>
	parts.filter((part) => Boolean(part)).join(" · ")

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value))

export const FirmwareQuotaDisplay = () => {
	const { data: quota } = useFirmwareQuota()

	if (!quota) {
		return null
	}

	const windowPercentUsed = (quota.windowUsed * 100).toFixed(2)
	const weeklyPercentUsed = (quota.weeklyUsed * 100).toFixed(2)

	const windowResetText = formatResetText(quota.windowReset)
	const weeklyResetText = formatWeeklyResetText(quota.weeklyReset)
	const windowResetsRemainingText = formatResetsRemainingText(quota.windowResetsRemaining)

	const isWindowAtLimit = quota.windowUsed >= 1
	const isWeeklyAtLimit = quota.weeklyUsed >= 1
	const isAtLimit = isWindowAtLimit || isWeeklyAtLimit
	const isWarning = quota.windowUsed >= 0.8 || quota.weeklyUsed >= 0.8

	const windowStatusText = formatMetaText(
		isWindowAtLimit ? "Limit reached" : null,
		windowResetText,
		windowResetsRemainingText,
	)
	const weeklyStatusText = formatMetaText(isWeeklyAtLimit ? "Limit reached" : null, weeklyResetText)

	const colorClass = isAtLimit
		? "text-vscode-errorForeground"
		: isWarning
			? "text-vscode-editorWarning-foreground"
			: "text-vscode-foreground"

	return (
		<div className={`${colorClass} flex flex-col gap-2`}>
			<div className="flex flex-col gap-1">
				<div className="flex items-center justify-between text-xs">
					<span className="text-vscode-descriptionForeground">Window</span>
					<span className="text-vscode-foreground/90">{windowPercentUsed}%</span>
				</div>
				<Progress value={clampPercent(quota.windowUsed * 100)} className="h-1.5" />
				{windowStatusText && <div className="text-xs text-vscode-foreground/90">{windowStatusText}</div>}
			</div>
			<div className="flex flex-col gap-1">
				<div className="flex items-center justify-between text-xs">
					<span className="text-vscode-descriptionForeground">Weekly</span>
					<span className="text-vscode-foreground/90">{weeklyPercentUsed}%</span>
				</div>
				<Progress value={clampPercent(quota.weeklyUsed * 100)} className="h-1.5" />
				{weeklyStatusText && <div className="text-xs text-vscode-foreground/90">{weeklyStatusText}</div>}
			</div>
		</div>
	)
}

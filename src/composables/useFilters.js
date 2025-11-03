// Vue 3 composable for filters (replacing Vue 2 filters)
export function useFilters() {
  const formatUnits = (v) => {
    if (v === null || v === undefined) return 'N/A'
    v = v * 1024 * 1024
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    for (let i = 0; i < units.length; i++) {
      if (v < 1024) {
        return Number(v).toFixed(2) + ' ' + units[i]
      }
      v = v / 1024
    }
    return Number(v).toFixed(2) + ' ' + units[units.length - 1]
  }

  const formatBytes = (v) => {
    if (v === null || v === undefined) return 'N/A'
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    for (let i = 0; i < units.length; i++) {
      if (v < 1024) {
        return Number(v).toFixed(2) + ' ' + units[i]
      }
      v = v / 1024
    }
    return Number(v).toFixed(2) + ' ' + units[units.length - 1]
  }

  const formatNetworkUnits = (v) => {
    if (v === null || v === undefined) return 'N/A'
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
    for (let i = 0; i < units.length; i++) {
      if (v < 1024) {
        return Number(v).toFixed(2) + ' ' + units[i]
      }
      v = v / 1024
    }
    return Number(v).toFixed(2) + ' ' + units[units.length - 1]
  }

  const formatPercent = (v) => {
    if (v === null || v === undefined) return 'N/A'
    return Number(v * 100).toFixed(2) + '%'
  }

  const formatLocalTime = (v) => {
    if (v === null || v === undefined) return 'N/A'
    const d = new Date() / 1000
    return Number((d - v / 1000)).toFixed(0) + ' secs'
  }

  const formatNumber = (v) => {
    if (v === null || v === undefined) return 'N/A'
    return Number(v).toLocaleString()
  }

  const formatHost = (v) => {
    if (v === null || v === undefined) return 'N/A'
    return v.toString()
  }

  const formatDuration = (v) => {
    if (v === null || v === undefined) return 'N/A'
    const seconds = Math.floor(v / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return {
    formatUnits,
    formatBytes,
    formatNetworkUnits,
    formatPercent,
    formatLocalTime,
    formatNumber,
    formatHost,
    formatDuration
  }
}

// Copyright 2017-2019 LinkedIn Corp. Licensed under the BSD 2-Clause License (the "License"). See License in the project root for license information.

export default {
  // disk is already in MB
  formatUnits (v) {
    v = v * 1024 * 1024
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    for (let i = 0; i < units.length; i++) {
      if (v <= Math.pow(1024, i + 1)) {
        return (v / Math.pow(1024, i)).toFixed(2) + ' ' + units[i]
      }
    }
  },
  // network is in KB
  formatNetworkUnits (v) {
    v = v * 1000
    const units = ['Bps', 'KBps', 'MBps', 'GBps', 'TBps', 'PBps', 'EBps', 'ZBps', 'YBps']
    for (let i = 0; i < units.length; i++) {
      if (v <= Math.pow(1024, i + 1)) {
        return (v / Math.pow(1024, i)).toFixed(0) + ' ' + units[i]
      }
    }
  },
  formatHost (v) {
    return v ? v.replace(/\.(\w+)\.(com|org|biz|net)$/, '') : v
  },
  formatNumber (v) {
    return Number(v).toLocaleString()
  },
  camelCase (v) {
    return v.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
  },
  splitCamelCase (v) {
    return v.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  },
  formatLocalTime (v) {
    const d = new Date() / 1000
    return Number(d - v / 1000).toFixed(0) + ' secs'
  }
}

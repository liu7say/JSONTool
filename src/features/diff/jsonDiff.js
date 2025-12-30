import { create } from 'jsondiffpatch'

const diffpatch = create({
  objectHash: (obj) => {
    if (!obj || typeof obj !== 'object') return String(obj)
    if (typeof obj.id === 'string' || typeof obj.id === 'number') return String(obj.id)
    return JSON.stringify(obj)
  },
})

export const diffJson = ({ leftValue, rightValue } = {}) => {
  return diffpatch.diff(leftValue, rightValue)
}



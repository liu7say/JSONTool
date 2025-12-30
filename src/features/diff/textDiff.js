import { diffLines } from 'diff'

export const diffText = ({ leftText = '', rightText = '' } = {}) => {
  return diffLines(leftText, rightText)
}



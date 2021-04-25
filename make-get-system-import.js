import relativise from './relativise.js'
import path from 'path'

let FILE_USE_IS_BEFORE = path.join('Logic', 'useIsBefore.js')
let FILE_USE_IS_HOVERED = path.join('Logic', 'useIsHovered.js')
let FILE_USE_IS_MEDIA = path.join('Logic', 'useIsMedia.js')
let FILE_USE_DATA = path.join('Data', 'ViewsData.js')
let FILE_USE_DATA_FORMAT = path.join('Views', 'Data', 'format.js')
let FILE_USE_DATA_VALIDATE = path.join('Views', 'Data', 'validate.js')
let FILE_USE_FLOW = path.join('Logic', 'ViewsFlow.js')

export default function makeGetSystemImport(src) {
  return function getSystemImport(id, file) {
    switch (id) {
      case 'Column':
        // Column is imported from react-virtualized
        break

      case 'ViewsUseIsMedia':
        return `import useIsMedia from '${relativise(
          file,
          path.join(src, FILE_USE_IS_MEDIA),
          src
        )}'`

      case 'ViewsUseIsBefore':
        return `import useIsBefore from '${relativise(
          file,
          path.join(src, FILE_USE_IS_BEFORE),
          src
        )}'`

      case 'ViewsUseIsHovered':
        return `import useIsHovered from '${relativise(
          file,
          path.join(src, FILE_USE_IS_HOVERED),
          src
        )}'`

      case 'ViewsUseData':
        return `import * as fromData from '${relativise(
          file,
          path.join(src, FILE_USE_DATA),
          src
        )}'`

      case 'ViewsUseDataFormat':
        return `import * as fromViewsFormat from '${relativise(
          file,
          path.join(src, FILE_USE_DATA_FORMAT),
          src
        )}'`

      case 'ViewsUseDataValidate':
        return `import * as fromViewsValidate from '${relativise(
          file,
          path.join(src, FILE_USE_DATA_VALIDATE),
          src
        )}'`

      case 'ViewsUseFlow':
        return `import * as fromFlow from '${relativise(
          file,
          path.join(src, FILE_USE_FLOW),
          src
        )}'`

      default:
        return false
    }
  }
}

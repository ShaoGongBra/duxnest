import { lazy } from 'react'

import UnpackIndexIndex from '../../apps/unpack/view/index/index/index'
import UnpackIndexTest from '../../apps/unpack/view/index/index/test'
import IndexIndexIndex from '../../apps/index/view/index/index/index'

export const routeList = {
  '/unpack': UnpackIndexIndex,
  '/unpack/index/test': UnpackIndexTest,
  '/': IndexIndexIndex
}

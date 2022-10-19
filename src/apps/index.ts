import { duxNestAppInstall } from '@/duxnest'
import unpack from './unpack'
import index from './index/index'

duxNestAppInstall(unpack, index)

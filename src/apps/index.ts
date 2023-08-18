import { duxNestAppInstall } from '@/duxnest'
import unpack from './unpack/app'
import index from './index/app'
import user from './user/app'

duxNestAppInstall(unpack, index, user)

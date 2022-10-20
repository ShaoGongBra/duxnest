import { useCallback, useContext, useEffect, useMemo, useRef, useState, createContext } from 'react'
import qs from 'qs'
import { routeList } from './RouteList'

const RouteContext = createContext({})

let routeKey = 0

export const routes = {}

/**
 * 将url和data参数进行合并 转换为新的url
 * @param {*} url
 * @param {*} data
 * @returns
 */
const toUrl = (url = location.pathname, data = {}) => {
  data = { ...qs.parse(url.split('?')[1] || ''), ...data }
  const stringify = qs.stringify(data)
  url = url.split('?')[0] + (stringify ? '?' + stringify : '')
  if (!url.startsWith('/')) {
    url = '/' + url
  }
  return url
}

export default ({
  // 模式 browser浏览器模式 hash HASH模式 custom 自定义模式
  mode = 'hash'
}) => {
  const key = useRef(routeKey)

  const [historys, setHistorys] = useState([{ url: toUrl(Object.keys(routeList)[0]), agree: 'push' }])

  useEffect(() => {
    routeKey++
    routes[key.current] = {
      push: (url, data) => {
        const state = {
          url: toUrl(url, data),
          agree: 'push'
        }
        setHistorys(old => {
          old.push(state)
          return [...old]
        })
        mode !== 'custom' && history.pushState(state, state.url, state.url)
      },
      replace: (url, data) => {
        const state = {
          url: toUrl(url, data),
          agree: 'push'
        }
        setHistorys(old => {
          old[old.length - 1] = state
          return [...old]
        })
        mode !== 'custom' && history.replaceState(state, state.url, state.url)
      },
      back: url => {
        const num = url | 0 || 1
        setHistorys(old => {
          old.splice(old.length - num)
          return [...old]
        })
        history.go(-num)
      }
    }
    return () => {
      // 删除路由
      delete routes[key.current]
    }
  }, [mode])

  useEffect(() => {
    if (mode !== 'custom') {
      const callback = e => {
        console.log(e)
      }
      window.addEventListener('popstate', callback)
      return () => {
        window.removeEventListener('popstate', callback)
      }
    }
  }, [mode])

  const Currnet = useMemo(() => {
    console.log(historys)
    const url = historys[historys.length - 1]?.url.split('?')[0]
    return (
      routeList[url] ||
      (() => {
        return null
      })
    )
  }, [historys])

  const context = useMemo(() => {
    return {
      key: key.current
    }
  }, [])

  return (
    <RouteContext.Provider value={context}>
      <Currnet />
    </RouteContext.Provider>
  )
}

export const Navigation = ({ children, type = 'push', url, data }) => {
  const { key } = useContext(RouteContext)

  const nav = useCallback(() => {
    routes[key]?.[type]?.(url, data)
  }, [key])

  return <div onClick={nav}>{children}</div>
}

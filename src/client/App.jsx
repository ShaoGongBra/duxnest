import React from 'react'
import { routerList } from './router/RouterList'

export default function App() {
  return (
    <div className="App">
      <div>初始化skdjhdf</div>
      {Object.values(routerList).map(Comp => (
        <Comp />
      ))}
    </div>
  )
}

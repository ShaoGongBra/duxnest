import { List } from '@arco-design/web-react'

export default () => {
  return (
    <List
      size="small"
      header="List title"
      dataSource={[
        'Beijing Bytedance Technology Co., Ltd.',
        'Bytedance Technology Co., Ltd.',
        'Beijing Toutiao Technology Co., Ltd.',
        'Beijing Volcengine Technology Co., Ltd.',
        'China Beijing Bytedance Technology Co., Ltd.'
      ]}
      render={(item, index) => <List.Item key={index}>{item}</List.Item>}
    />
  )
}

# duxNest

## 在线打包服务

可以将项目打包并上传至蒲公英测试平台

## 使用了Taro2的项目打包

### 配置修改
修改`config/index.js`,添加下面的配置

```js
rn: {
  // 添加这行
  onlyTaroToRn: true
}
```

项目根目录下新建`duxapp.config.js`,添加以下配置

```javascript
const config = {
  /**
   * 蒲公英上传测试包key
   * 请到蒲公英获取下面两个参数并配置
   */
  pgyer: {
    apiKey: '348a900d67702986fbb93b1c19799e1f',
    userKey: 'b47c69e626e6300b3a5e23a1ccad3875'
  }
}

module.exports = config
```

添加`duxapp-cli`依赖

```bash
yarn add duxapp-cli
```

### 添加项目
将git地址填写到添加项目的地址框,点击确定即可添加项目,添加后即可打包  
每次同步代码后可以直接点打包即可打包

## 使用了duxapp新建的项目

不用配置,添加项目后即可打包
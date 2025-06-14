// 导入 SDK, 当 TOS Node.JS SDK 版本小于 2.5.2 请把下方 TosClient 改成 TOS 导入
const { TosClient } = require('@volcengine/tos-sdk')
const fs = require('fs')
const path = require('path')

module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('tos-upload', {
      handle,
      name: "火山云图床",
      config: config
    })
  }

  const handle = async (ctx) => {
    let userConfig = ctx.getConfig('picBed.tos-upload')
    if (!userConfig.accessKeyId) {
      ctx.emit('notification', {
        title: '请先配置accessKeyId',
        body: '链接已复制，请打开浏览器粘贴地址查看相关教程',
        text: 'https://github.com/MissingDirection/picgo-plugin-tos-upload/blob/main/README.md'
      })
      return
    }
    if (!userConfig.accessKeySecret) {
      ctx.emit('notification', {
        title: '请先配置accessKeySecret',
        body: '链接已复制，请打开浏览器粘贴地址查看相关教程',
        text: 'https://github.com/MissingDirection/picgo-plugin-tos-upload/blob/main/README.md'
      })
      return
    }
    if (!userConfig.region) {
      ctx.emit('notification', {
        title: '请先配置region',
        body: '链接已复制，请打开浏览器粘贴地址查看相关教程',
        text: 'https://github.com/MissingDirection/picgo-plugin-tos-upload/blob/main/README.md'
      })
      return
    }
    if (!userConfig.endpoint) {
      ctx.emit('notification', {
        title: '请先配置endpoint',
        body: '链接已复制，请打开浏览器粘贴地址查看相关教程',
        text: 'https://github.com/MissingDirection/picgo-plugin-tos-upload/blob/main/README.md'
      })
      return
    }
    if (!userConfig.bucketName) {
      ctx.emit('notification', {
        title: '请先配置bucketName',
        body: '链接已复制，请打开浏览器粘贴地址查看相关教程',
        text: 'https://github.com/MissingDirection/picgo-plugin-tos-upload/blob/main/README.md'
      })
      return
    }
    const configName = userConfig._configName
    const bucketName = userConfig.bucketName
    const accessKeyId = userConfig.accessKeyId
    const accessKeySecret = userConfig.accessKeySecret
    const region = userConfig.region
    const endpoint = userConfig.endpoint
    const imgList = ctx.output

    // 创建客户端
    const client = new TosClient({
      accessKeyId: accessKeyId,
      accessKeySecret: accessKeySecret,
      region: region, // 填写 Bucket 所在地域。以华北2（北京)为例，"Provide your region" 填写为 cn-beijing。
      endpoint: endpoint, // 填写域名地址
    });
    console.log('client', client)
    for (let i in imgList) {
      let image = imgList[i].buffer
      if (!image && imgList[i].base64Image) {
        image = Buffer.from(imgList[i].base64Image, 'base64')
      }
      const data = new Uint8Array(image)
      const ext = path.extname(imgList[i].fileName)
      const base = path.basename(imgList[i].fileName, ext)
      const timestamp = new Date().getTime()
      const fileName = `${base}_${timestamp}${ext}`
      const filePath = path.join(__dirname, fileName)
      await fs.writeFileSync(filePath, data)
      try {
        // 上传对象
        await client.putObject({
          bucket: bucketName,
          key: configName + '/' + fileName,
          body: imgList[i].buffer,
        });
        // 删除image对象
        delete imgList[i].base64Image
        delete imgList[i].Buffer
        //示例https://test-1486.tos-cn-beijing.volces.com/images/image-20250614110828212_1749870508272.png
        imgList[i].imgUrl = "https://" + bucketName + '.' + endpoint + '/' + configName + '/' + fileName
        // object size: 11
        // ctx.emit('notification', {
        //  title: '上传成功',
        //   body: data
        //})

      } catch (e) {
        ctx.emit('notification', {
          title: '上传失败',
          body: e.message
        })
        throw new Error(e.message)
      }
      // ✅ 删除临时文件
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('删除临时文件失败:', err)
        } else {
          console.log('临时文件已删除:', filePath)
        }
      })
    }
    return ctx
  }

  const config = ctx => {
    let userConfig = ctx.getConfig('picBed.tos-upload')
    if (!userConfig) {
      userConfig = {}
    }
    return [
      {
        name: '获取tos上传相关配置',
        type: 'input',
        default: 'https://console.volcengine.com/tos/bucket?projectName=default',
        alias: '获取tos上传相关配置'
      },
      {
        name: 'accessKeyId',
        type: 'input',
        default: userConfig.accessKeyId,
        required: true,
        message: 'accessKeyId',
        alias: 'accessKeyId'
      },
      {
        name: 'accessKeySecret',
        type: 'input',
        default: userConfig.accessKeySecret,
        required: true,
        message: 'accessKeySecret',
        alias: 'accessKeySecret'
      },
      {
        name: 'region',
        type: 'input',
        default: userConfig.region,
        required: true,
        message: 'region',
        alias: 'region'
      },
      {
        name: 'endpoint',
        type: 'input',
        default: userConfig.endpoint,
        required: true,
        message: 'endpoint',
        alias: 'endpoint'
      },
      {
        name: 'bucketName',
        type: 'input',
        default: userConfig.bucketName,
        required: true,
        message: 'bucketName',
        alias: 'bucketName'
      }
    ]
  }
  return {
    uploader: 'tos-upload',
    config: config,
    register
  }
}

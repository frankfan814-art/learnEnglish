# 英语单词学习 App

一个简洁高效的英语单词学习应用，采用“扫书”式快速浏览学习方式，基于本地词库与例句数据进行学习。

## 功能特性

✅ **核心功能**
- 本地词库与例句数据（已生成）
- 卡片式学习界面，简洁直观
- 上一个/下一个导航控制
- 键盘快捷键支持（← → 方向键）
- 单词和例句发音（使用 Web Speech API）
- 进度自动保存和恢复
- 今日学习量统计
- 完成一轮后自动重新开始
- 收藏单词功能

✅ **单词数据**
- 英文单词 + 音标
- 中文释义和词性
- 实用例句（默认 10 个，可按需生成）
- 常用搭配
- 同义词/反义词
- 使用场景
- 难度等级

✅ **学习功能**
- 每日学习目标（可设置）
- 学习进度保存（LocalStorage）
- 学习统计面板
- 响应式设计，支持手机/平板

## 技术栈

- **前端框架**: React 18
- **构建工具**: Vite
- **语音合成**: Web Speech API
- **数据存储**: LocalStorage
- **样式**: CSS3 (渐变、动画、响应式)

## 项目结构

```
englishLearn/
├── src/
│   ├── components/          # React 组件
│   │   ├── WordCard.jsx    # 单词卡片组件
│   │   ├── NavigationControls.jsx  # 导航控制组件
│   │   └── LearningPage.jsx  # 学习页面主组件
│   ├── data/               # 数据文件
│   │   └── generated/       # 生成数据
│   │       └── word_examples.json
│   ├── hooks/              # 自定义 Hooks
│   ├── utils/              # 工具函数
│   │   ├── storage.js      # 本地存储管理
│   │   └── speech.js       # 语音合成工具
│   ├── styles/             # 样式文件
│   │   ├── App.css
│   │   ├── LearningPage.css
│   │   ├── WordCard.css
│   │   └── NavigationControls.css
│   ├── App.jsx             # 根组件
│   └── main.jsx            # 入口文件
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 安装和运行

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 打开浏览器访问：`http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

## 使用说明

### 基本操作

1. **浏览单词**
   - 点击"下一个"按钮或按 `→` 键查看下一个单词
   - 点击"上一个"按钮或按 `←` 键返回上一个单词

2. **播放发音**
   - 点击单词旁的音频按钮播放单词发音
   - 点击例句旁的播放按钮播放句子发音

3. **查看详细信息**
   - 例句与释义默认展开显示

4. **收藏单词**
   - 点击右上角的星标按钮收藏/取消收藏单词

5. **查看统计**
   - 点击顶部状态栏的统计图标查看学习数据
   - 可以重置学习进度（慎用）

### 学习进度

- 进度自动保存到浏览器本地存储
- 关闭浏览器后再次打开会恢复到上次的位置
- 完成全部单词后会自动从头开始新一轮学习

### 数据结构

每个单词包含以下信息：
```javascript
{
  id: 'unique_id',
  word: 'example',
  phonetic: '/ɪɡˈzæmpl/',
  definitions: [
    { partOfSpeech: 'n.', meaning: '例子，榜样' }
  ],
  examples: [
    {
      sentence: 'This is a good example.',
      translation: '这是一个好例子。'
    }
  ],
  collocations: ['for example', 'follow someone\'s example'],
  synonyms: ['instance', 'case'],
  antonyms: [],
  scenarios: ['日常对话', '学术写作'],
  difficulty: 'intermediate',
  category: '基础词汇'
}
```

## 词库来源

- 本地数据文件： [src/data/generated/word_examples.json](src/data/generated/word_examples.json)
- 词性与翻译在构建阶段写入

## 待实现功能

- [ ] AI内容生成优化（例句自动补全）
- [ ] 艾宾浩斯复习系统
- [ ] 测验功能（听写、选择题）
- [ ] 云端数据同步
- [ ] 离线支持（PWA）
- [ ] 多主题切换
- [ ] 学习计划自定义

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动端浏览器（支持 Web Speech API）

## 注意事项

1. **语音功能**: 依赖浏览器的 Web Speech API，需要在支持的浏览器中使用
2. **数据持久化**: 使用 LocalStorage，清除浏览器数据会丢失学习进度
3. **性能**: 大量单词时建议使用虚拟滚动或分页加载

## 开发建议

### 扩展单词数据
建议按以下分类组织单词：
- 日常用语（问候、礼貌）
- 时间、数字、颜色
- 人物、职业、家庭
- 食物、饮料
- 居住、家具
- 交通、旅游
- 工作、教育
- 购物、金钱
- 健康、医疗
- 运动、娱乐

### 性能优化
- 实现单词懒加载
- 缓存发音音频
- 使用 IndexedDB 存储大量数据

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**开始学习英语吧！** 📚🎓

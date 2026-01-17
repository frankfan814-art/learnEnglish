/**
 * 单词数据结构
 */
export const wordSchema = {
  id: 'unique_id',
  word: 'example',
  phonetic: '/ɪɡˈzæmpl/',
  definitions: [
    {
      partOfSpeech: 'n.',
      meaning: '例子，榜样'
    }
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

/**
 * 10000个单词的示例数据（当前提供部分示例，实际使用时可以扩展到10000个）
 */
export const sampleWords = [
  {
    id: '1',
    word: 'hello',
    phonetic: '/həˈloʊ/',
    definitions: [
      { partOfSpeech: 'int.', meaning: '你好，问候' }
    ],
    examples: [
      { sentence: 'Hello, how are you?', translation: '你好，你好吗？' },
      { sentence: 'Say hello to your parents.', translation: '向你的父母问好。' },
      { sentence: 'Hello! Is anyone there?', translation: '喂！有人吗？' }
    ],
    collocations: ['say hello', 'hello there'],
    synonyms: ['hi', 'greetings'],
    antonyms: ['goodbye'],
    scenarios: ['日常问候', '电话通话'],
    difficulty: 'beginner',
    category: '日常用语'
  },
  {
    id: '2',
    word: 'good',
    phonetic: '/ɡʊd/',
    definitions: [
      { partOfSpeech: 'adj.', meaning: '好的，优秀的' },
      { partOfSpeech: 'n.', meaning: '好处，利益' }
    ],
    examples: [
      { sentence: 'She is a good student.', translation: '她是一个好学生。' },
      { sentence: 'Have a good day!', translation: '祝你度过愉快的一天！' },
      { sentence: 'This restaurant serves good food.', translation: '这家餐厅提供好的食物。' }
    ],
    collocations: ['good morning', 'very good', 'good at', 'good for'],
    synonyms: ['excellent', 'fine', 'great'],
    antonyms: ['bad', 'poor'],
    scenarios: ['日常对话', '表达评价'],
    difficulty: 'beginner',
    category: '形容词'
  },
  {
    id: '3',
    word: 'morning',
    phonetic: '/ˈmɔːrnɪŋ/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '早晨，上午' }
    ],
    examples: [
      { sentence: 'Good morning!', translation: '早上好！' },
      { sentence: 'I exercise every morning.', translation: '我每天早上锻炼。' },
      { sentence: 'The morning sun is bright.', translation: '晨光很明亮。' }
    ],
    collocations: ['in the morning', 'early morning', 'morning coffee'],
    synonyms: ['dawn', 'daybreak'],
    antonyms: ['evening', 'night'],
    scenarios: ['日常对话', '时间表达'],
    difficulty: 'beginner',
    category: '时间'
  },
  {
    id: '4',
    word: 'thank',
    phonetic: '/θæŋk/',
    definitions: [
      { partOfSpeech: 'v.', meaning: '感谢，谢谢' }
    ],
    examples: [
      { sentence: 'Thank you for your help.', translation: '谢谢你的帮助。' },
      { sentence: 'I thank God every day.', translation: '我每天感谢上帝。' },
      { sentence: 'Thanks for coming!', translation: '谢谢光临！' }
    ],
    collocations: ['thank you', 'thank God', 'thank for'],
    synonyms: ['appreciate', 'grateful'],
    antonyms: [],
    scenarios: ['礼貌用语', '表达感激'],
    difficulty: 'beginner',
    category: '日常用语'
  },
  {
    id: '5',
    word: 'please',
    phonetic: '/pliːz/',
    definitions: [
      { partOfSpeech: 'adv.', meaning: '请（礼貌用语）' },
      { partOfSpeech: 'v.', meaning: '使高兴，使满意' }
    ],
    examples: [
      { sentence: 'Please help me with this.', translation: '请帮我处理这个。' },
      { sentence: 'Would you please close the door?', translation: '请你关上门好吗？' },
      { sentence: 'Your presence pleased us greatly.', translation: '你的光临让我们很高兴。' }
    ],
    collocations: ['please help', 'if you please', 'yes please'],
    synonyms: ['delight', 'satisfy'],
    antonyms: ['anger', 'annoy'],
    scenarios: ['礼貌请求', '服务场景'],
    difficulty: 'beginner',
    category: '日常用语'
  },
  {
    id: '6',
    word: 'water',
    phonetic: '/ˈwɔːtər/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '水' },
      { partOfSpeech: 'v.', meaning: '浇水，供水' }
    ],
    examples: [
      { sentence: 'I drink a glass of water every morning.', translation: '我每天早上喝一杯水。' },
      { sentence: 'Don\'t forget to water the plants.', translation: '别忘了给植物浇水。' },
      { sentence: 'The water is too cold.', translation: '水太冷了。' }
    ],
    collocations: ['drinking water', 'water bottle', 'deep water'],
    synonyms: ['H2O', 'liquid'],
    antonyms: [],
    scenarios: ['日常生活', '餐厅点餐'],
    difficulty: 'beginner',
    category: '饮食'
  },
  {
    id: '7',
    word: 'food',
    phonetic: '/fuːd/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '食物，食品' }
    ],
    examples: [
      { sentence: 'The food here is delicious.', translation: '这里的食物很好吃。' },
      { sentence: 'We need to buy more food.', translation: '我们需要买更多食物。' },
      { sentence: 'Fast food is not healthy.', translation: '快餐不健康。' }
    ],
    collocations: ['fast food', 'junk food', 'food delivery'],
    synonyms: ['meal', 'nourishment', 'cuisine'],
    antonyms: [],
    scenarios: ['餐厅', '购物', '烹饪'],
    difficulty: 'beginner',
    category: '饮食'
  },
  {
    id: '8',
    word: 'house',
    phonetic: '/haʊs/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '房子，住宅' },
      { partOfSpeech: 'v.', meaning: '给...提供住房' }
    ],
    examples: [
      { sentence: 'They bought a new house.', translation: '他们买了一栋新房子。' },
      { sentence: 'The museum houses ancient artifacts.', translation: '博物馆收藏着古代文物。' },
      { sentence: 'My house is near the park.', translation: '我的房子在公园附近。' }
    ],
    collocations: ['buy a house', 'house warming', 'full house'],
    synonyms: ['home', 'residence', 'dwelling'],
    antonyms: [],
    scenarios: ['居住', '房地产', '日常生活'],
    difficulty: 'beginner',
    category: '居住'
  },
  {
    id: '9',
    word: 'family',
    phonetic: '/ˈfæmɪli/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '家庭，家人' }
    ],
    examples: [
      { sentence: 'My family is very important to me.', translation: '我的家人对我来说非常重要。' },
      { sentence: 'We had a family dinner last night.', translation: '我们昨晚吃了家庭聚餐。' },
      { sentence: 'She comes from a large family.', translation: '她来自一个大家庭。' }
    ],
    collocations: ['family member', 'family tree', 'nuclear family'],
    synonyms: ['relatives', 'kin', 'household'],
    antonyms: [],
    scenarios: ['家庭关系', '社交介绍'],
    difficulty: 'beginner',
    category: '人物关系'
  },
  {
    id: '10',
    word: 'friend',
    phonetic: '/frend/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '朋友' }
    ],
    examples: [
      { sentence: 'She is my best friend.', translation: '她是我最好的朋友。' },
      { sentence: 'We became friends in college.', translation: '我们在大学时成为朋友。' },
      { sentence: 'A friend in need is a friend indeed.', translation: '患难见真情。' }
    ],
    collocations: ['best friend', 'make friends', 'friend request'],
    synonyms: ['companion', 'pal', 'buddy'],
    antonyms: ['enemy', 'foe'],
    scenarios: ['社交', '人际关系'],
    difficulty: 'beginner',
    category: '人物关系'
  },
  {
    id: '11',
    word: 'work',
    phonetic: '/wɜːrk/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '工作，职业' },
      { partOfSpeech: 'v.', meaning: '工作，运作' }
    ],
    examples: [
      { sentence: 'I go to work by bus.', translation: '我坐公交车去上班。' },
      { sentence: 'This machine doesn\'t work.', translation: '这台机器不工作。' },
      { sentence: 'She works hard every day.', translation: '她每天都努力工作。' }
    ],
    collocations: ['go to work', 'hard work', 'work out'],
    synonyms: ['job', 'labor', 'function'],
    antonyms: ['rest', 'relax'],
    scenarios: ['职场', '日常对话'],
    difficulty: 'beginner',
    category: '工作'
  },
  {
    id: '12',
    word: 'time',
    phonetic: '/taɪm/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '时间，时候' }
    ],
    examples: [
      { sentence: 'What time is it?', translation: '现在几点了？' },
      { sentence: 'I don\'t have time for breakfast.', translation: '我没有时间吃早餐。' },
      { sentence: 'Time flies when you\'re having fun.', translation: '快乐时光过得快。' }
    ],
    collocations: ['on time', 'free time', 'spend time'],
    synonyms: ['moment', 'period', 'duration'],
    antonyms: [],
    scenarios: ['日常对话', '约会安排'],
    difficulty: 'beginner',
    category: '时间'
  },
  {
    id: '13',
    word: 'day',
    phonetic: '/deɪ/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '天，白天' }
    ],
    examples: [
      { sentence: 'What day is today?', translation: '今天是星期几？' },
      { sentence: 'I work eight hours a day.', translation: '我每天工作八小时。' },
      { sentence: 'Have a nice day!', translation: '祝你度过愉快的一天！' }
    ],
    collocations: ['every day', 'day and night', 'one day'],
    synonyms: ['date', 'daytime'],
    antonyms: ['night'],
    scenarios: ['时间表达', '日常安排'],
    difficulty: 'beginner',
    category: '时间'
  },
  {
    id: '14',
    word: 'money',
    phonetic: '/ˈmʌni/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '钱，货币' }
    ],
    examples: [
      { sentence: 'I need to save more money.', translation: '我需要存更多钱。' },
      { sentence: 'Time is money.', translation: '时间就是金钱。' },
      { sentence: 'How much money do you have?', translation: '你有多少钱？' }
    ],
    collocations: ['save money', 'spend money', 'make money'],
    synonyms: ['cash', 'currency', 'funds'],
    antonyms: [],
    scenarios: ['购物', '金融', '日常对话'],
    difficulty: 'beginner',
    category: '金融'
  },
  {
    id: '15',
    word: 'book',
    phonetic: '/bʊk/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '书，书籍' },
      { partOfSpeech: 'v.', meaning: '预订' }
    ],
    examples: [
      { sentence: 'I am reading a good book.', translation: '我正在读一本好书。' },
      { sentence: 'I booked a hotel room.', translation: '我预订了一个酒店房间。' },
      { sentence: 'This book is very interesting.', translation: '这本书很有趣。' }
    ],
    collocations: ['read a book', 'book a ticket', 'phone book'],
    synonyms: ['reserve', 'novel', 'publication'],
    antonyms: [],
    scenarios: ['学习', '旅行', '娱乐'],
    difficulty: 'beginner',
    category: '物品'
  },
  {
    id: '16',
    word: 'school',
    phonetic: '/skuːl/',
    definitions: [
      { partOfSpeech: 'n.', meaning: '学校' }
    ],
    examples: [
      { sentence: 'I go to school every day.', translation: '我每天都去上学。' },
      { sentence: 'She studies at Harvard Law School.', translation: '她在哈佛法学院学习。' },
      { sentence: 'School starts at 8 o\'clock.', translation: '学校8点开始上课。' }
    ],
    collocations: ['go to school', 'high school', 'school bus'],
    synonyms: ['educational institution', 'academy'],
    antonyms: [],
    scenarios: ['教育', '日常生活'],
    difficulty: 'beginner',
    category: '教育'
  },
  {
    id: '17',
    word: 'learn',
    phonetic: '/lɜːrn/',
    definitions: [
      { partOfSpeech: 'v.', meaning: '学习，得知' }
    ],
    examples: [
      { sentence: 'I want to learn English.', translation: '我想学英语。' },
      { sentence: 'She learned to play the piano.', translation: '她学会了弹钢琴。' },
      { sentence: 'We learn something new every day.', translation: '我们每天都学到新东西。' }
    ],
    collocations: ['learn from', 'learn by heart', 'learn a lesson'],
    synonyms: ['study', 'acquire', 'discover'],
    antonyms: ['teach', 'forget'],
    scenarios: ['教育', '技能发展'],
    difficulty: 'beginner',
    category: '学习'
  },
  {
    id: '18',
    word: 'walk',
    phonetic: '/wɔːk/',
    definitions: [
      { partOfSpeech: 'v.', meaning: '走路，散步' },
      { partOfSpeech: 'n.', meaning: '步行，散步' }
    ],
    examples: [
      { sentence: 'I walk to work every morning.', translation: '我每天早上走路去上班。' },
      { sentence: 'Let\'s go for a walk.', translation: '我们去散步吧。' },
      { sentence: 'The baby is learning to walk.', translation: '宝宝正在学走路。' }
    ],
    collocations: ['go for a walk', 'walk away', 'take a walk'],
    synonyms: ['stroll', 'hike', 'march'],
    antonyms: ['run', 'drive'],
    scenarios: ['运动', '交通'],
    difficulty: 'beginner',
    category: '运动'
  },
  {
    id: '19',
    word: 'talk',
    phonetic: '/tɔːk/',
    definitions: [
      { partOfSpeech: 'v.', meaning: '谈话，交谈' },
      { partOfSpeech: 'n.', meaning: '谈话，演讲' }
    ],
    examples: [
      { sentence: 'Let\'s talk about it.', translation: '让我们谈谈这件事。' },
      { sentence: 'She gave a talk on climate change.', translation: '她做了一个关于气候变化的演讲。' },
      { sentence: 'Can I talk to you for a moment?', translation: '我可以和你谈谈吗？' }
    ],
    collocations: ['talk about', 'talk to', 'talk show'],
    synonyms: ['speak', 'converse', 'discuss'],
    antonyms: ['listen', 'silent'],
    scenarios: ['社交', '会议', '日常对话'],
    difficulty: 'beginner',
    category: '交流'
  },
  {
    id: '20',
    word: 'see',
    phonetic: '/siː/',
    definitions: [
      { partOfSpeech: 'v.', meaning: '看见，明白' }
    ],
    examples: [
      { sentence: 'I can see the mountain from here.', translation: '我可以从这里看到山。' },
      { sentence: 'Do you see what I mean?', translation: '你明白我的意思吗？' },
      { sentence: 'I\'ll see you tomorrow.', translation: '明天见。' }
    ],
    collocations: ['see you', 'see a doctor', 'let me see'],
    synonyms: ['observe', 'perceive', 'understand'],
    antonyms: ['blind'],
    scenarios: ['日常对话', '视觉'],
    difficulty: 'beginner',
    category: '感知'
  }
]

/**
 * 扩展到更多单词（实际使用时需要达到10000个）
 * 这里提供一些常用的生活英语单词类别
 */

// 问候与礼貌用语
const greetingsWords = [
  'hi', 'bye', 'goodbye', 'excuse me', 'sorry', 'welcome', 'congratulations'
]

// 数字
const numbersWords = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'twenty', 'thirty', 'hundred', 'thousand'
]

// 颜色
const colorsWords = [
  'red', 'blue', 'green', 'yellow', 'white', 'black', 'orange', 'purple', 'pink'
]

// 身体部位
const bodyWords = [
  'head', 'face', 'eye', 'ear', 'nose', 'mouth', 'hand', 'foot', 'arm', 'leg'
]

// 衣服
const clothesWords = [
  'shirt', 'pants', 'dress', 'shoes', 'hat', 'coat', 'jacket', 'socks'
]

// 食物
const foodWords = [
  'bread', 'rice', 'meat', 'chicken', 'fish', 'egg', 'milk', 'coffee', 'tea',
  'apple', 'banana', 'orange', 'vegetable', 'tomato', 'potato'
]

// 交通
const transportWords = [
  'car', 'bus', 'train', 'plane', 'bicycle', 'taxi', 'subway', 'boat'
]

// 职业
const jobsWords = [
  'teacher', 'doctor', 'driver', 'cook', 'engineer', 'lawyer', 'artist', 'musician'
]

// 动物
const animalWords = [
  'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'chicken', 'sheep'
]

// 自然
const natureWords = [
  'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind', 'tree', 'flower'
]

/**
 * 生成更多单词数据的辅助函数
 * 在实际应用中，你可以使用AI API来生成完整的单词数据
 */
export const generateWordData = (word, category) => {
  return {
    id: Math.random().toString(36).substr(2, 9),
    word,
    category,
    difficulty: 'beginner',
    definitions: [],
    examples: [],
    collocations: [],
    synonyms: [],
    antonyms: [],
    scenarios: []
  }
}

/**
 * 生成基础单词条目（用于快速扩展词库）
 */
const createBasicEntry = (word, category) => {
  return {
    id: `${category}-${word}`.replace(/\s+/g, '-'),
    word,
    phonetic: '',
    definitions: [
      { partOfSpeech: 'n.', meaning: '常用生活词汇（待完善）' }
    ],
    examples: [
      {
        sentence: `This is a common word: ${word}.`,
        translation: `这是一个常用单词：${word}。`
      }
    ],
    collocations: [],
    synonyms: [],
    antonyms: [],
    scenarios: [category],
    difficulty: 'beginner',
    category
  }
}

/**
 * 从词表批量生成基础条目
 */
const createEntriesFromList = (list, category) => {
  return list.map((word) => createBasicEntry(word, category))
}

/**
 * 组合扩展词库（当前约百余词，后续可替换为完整10000词库）
 */
const extendedWords = [
  ...sampleWords,
  ...createEntriesFromList(greetingsWords, '问候与礼貌'),
  ...createEntriesFromList(numbersWords, '数字'),
  ...createEntriesFromList(colorsWords, '颜色'),
  ...createEntriesFromList(bodyWords, '身体部位'),
  ...createEntriesFromList(clothesWords, '衣物'),
  ...createEntriesFromList(foodWords, '食物'),
  ...createEntriesFromList(transportWords, '交通'),
  ...createEntriesFromList(jobsWords, '职业'),
  ...createEntriesFromList(animalWords, '动物'),
  ...createEntriesFromList(natureWords, '自然')
]

/**
 * 去重（按 word 字段）
 */
const dedupeByWord = (list) => {
  const seen = new Set()
  return list.filter((item) => {
    const key = item.word.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * 导出所有单词数据
 */
export const getAllWords = () => {
  return dedupeByWord(extendedWords)
}

export default sampleWords

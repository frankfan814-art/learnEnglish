/**
 * 从数据集取更多单词，过滤小学和初中词汇，保持最常用顺序
 *
 * 小学词汇：505个（义务教育英语课程标准二级词汇表）
 * 初中词汇：1600个（义务教育英语课程标准三级词汇表）
 * 目标：最终获得 20000 个非小学初中的单词
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const csvPath = path.join(__dirname, '../src/data/valid_words_sorted_by_frequency.csv')
const csvContent = fs.readFileSync(csvPath, 'utf-8')

// 目标最终单词数量
const TARGET_COUNT = 20000

// 小学词汇表（505词）- 二级词汇
const primarySchoolWords = new Set([
  'a', 'an', 'about', 'after', 'afternoon', 'again', 'age', 'ago', 'air', 'all', 'also', 'always', 'and', 'angry', 'animal', 'answer', 'any', 'apple', 'arm', 'art', 'ask', 'astronaut', 'at', 'aunt', 'autumn',
  'baby', 'back', 'bad', 'bag', 'ball', 'banana', 'basketball', 'be', 'am', 'is', 'are', 'beach', 'bear', 'beautiful', 'because', 'bed', 'bee', 'before', 'begin', 'behind', 'beside', 'best', 'between', 'big', 'bike', 'bicycle', 'bird', 'birthday', 'black', 'blackboard', 'blue', 'boat', 'body', 'book', 'box', 'boy', 'bread', 'breakfast', 'bring', 'brother', 'brown', 'bus', 'busy', 'but', 'buy', 'by',
  'cake', 'call', 'can', 'candle', 'candy', 'cap', 'car', 'card', 'careful', 'cat', 'catch', 'chair', 'chicken', 'child', 'children', 'china', 'chinese', 'chore', 'cinema', 'city', 'class', 'classroom', 'clean', 'clever', 'clock', 'close', 'clothes', 'cloudy', 'coat', 'cold', 'colour', 'color', 'come', 'computer', 'cook', 'cool', 'cousin', 'cow', 'cry', 'cup', 'cut', 'cute',
  'dance', 'day', 'dear', 'desk', 'difficult', 'dinner', 'dirty', 'do', 'does', 'doctor', 'dog', 'doll', 'door', 'down', 'draw', 'dress', 'drink', 'driver', 'duck',
  'ear', 'early', 'earth', 'easy', 'eat', 'egg', 'elephant', 'email', 'english', 'evening', 'every', 'excited', 'exercise', 'eye',
  'face', 'family', 'famous', 'fan', 'far', 'farm', 'farmer', 'fast', 'father', 'dad', 'favourite', 'favorite', 'feel', 'film', 'find', 'fine', 'fire', 'fish', 'floor', 'flower', 'fly', 'food', 'foot', 'feet', 'football', 'for', 'free', 'friend', 'from', 'front', 'fruit',
  'game', 'garden', 'get', 'gift', 'girl', 'give', 'glass', 'go', 'goes', 'good', 'goodbye', 'bye', 'grandfather', 'grandpa', 'grandmother', 'grandma', 'grape', 'grass', 'great', 'green',
  'hair', 'half', 'hand', 'happy', 'hard', 'have', 'has', 'he', 'head', 'healthy', 'hear', 'heavy', 'hello', 'help', 'helpful', 'her', 'here', 'hi', 'hill', 'him', 'his', 'holiday', 'home', 'hometown', 'horse', 'hospital', 'hot', 'hour', 'house', 'how', 'hungry', 'hurry', 'hurt',
  'i', 'ice', 'ice cream', 'idea', 'ill', 'in', 'interesting', 'internet', 'it', 'its',
  'job', 'juice', 'jump',
  'keep', 'kid', 'kind', 'kitchen', 'kite', 'know',
  'lake', 'last', 'late', 'learn', 'left', 'leg', 'lesson', 'let', 'letter', 'library', 'light', 'like', 'lion', 'listen', 'little', 'live', 'long', 'look', 'lot', 'love', 'lovely', 'lunch',
  'make', 'man', 'men', 'many', 'map', 'maths', 'math', 'mathematics', 'may', 'me', 'meat', 'meet', 'middle', 'milk', 'minute', 'miss', 'money', 'monkey', 'month', 'moon', 'morning', 'mother', 'mum', 'mom', 'mouse', 'mice', 'mouth', 'move', 'mr', 'mrs', 'ms', 'much', 'music', 'must', 'my',
  'name', 'near', 'never', 'new', 'next', 'nice', 'night', 'no', 'noodle', 'nose', 'not', 'now', 'nurse',
  'o\'clock', 'of', 'off', 'often', 'ok', 'okay', 'old', 'on', 'open', 'or', 'orange', 'our', 'out', 'over',
  'pair', 'panda', 'paper', 'parent', 'park', 'party', 'pe', 'physical education', 'pen', 'pencil', 'people', 'pet', 'phone', 'photo', 'photograph', 'piano', 'picture', 'pig', 'ping-pong', 'pink', 'place', 'plane', 'plant', 'play', 'playground', 'please', 'police', 'potato', 'put',
  'question', 'quiet',
  'rabbit', 'rain', 'read', 'red', 'rice', 'right', 'river', 'robot', 'room', 'ruler', 'run',
  'sad', 'safe', 'say', 'school', 'schoolbag', 'science', 'sea', 'season', 'see', 'sell', 'share', 'she', 'sheep', 'ship', 'shirt', 'shoe', 'shop', 'short', 'shorts', 'should', 'show', 'sing', 'sister', 'sit', 'skirt', 'sleep', 'slow', 'small', 'snow', 'so', 'sock', 'some', 'sometimes', 'song', 'sorry', 'soup', 'space', 'speak', 'sport', 'spring', 'stand', 'star', 'stop', 'story', 'street', 'strong', 'student', 'study', 'subject', 'summer', 'sun', 'sunny', 'supermarket', 'sure', 'sweater', 'sweep', 'swim',
  'table', 'tail', 'take', 'talk', 'tall', 'taxi', 'tea', 'teacher', 'tell', 'thank', 'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'thin', 'think', 'this', 'those', 'tidy', 'tiger', 'time', 'tired', 'to', 'today', 'toilet', 'tomato', 'tomorrow', 'too', 'top', 'toy', 'train', 'travel', 'tree', 'trousers', 'try', 'turn', 'tv', 'television',
  'umbrella', 'uncle', 'under', 'up', 'us', 'use',
  'vegetable', 'very', 'visit',
  'wait', 'wake', 'walk', 'wall', 'want', 'warm', 'wash', 'watch', 'water', 'way', 'we', 'wear', 'weather', 'week', 'welcome', 'well', 'what', 'when', 'where', 'which', 'white', 'who', 'whose', 'why', 'will', 'win', 'window', 'windy', 'winter', 'wish', 'with', 'woman', 'women', 'wonderful', 'word', 'work', 'worker', 'world', 'worry', 'write', 'wrong',
  'year', 'yellow', 'yes', 'yesterday', 'you', 'young', 'your',
  'zoo'
])

// 初中词汇表（1600词）- 三级词汇（包含小学505词）
// 基于义务教育英语课程标准
const middleSchoolWords = new Set([
  ...primarySchoolWords,
  // 初中新增词汇
  'ability', 'able', 'above', 'abroad', 'absent', 'accept', 'accident', 'according', 'account', 'ache', 'achieve', 'across', 'act', 'action', 'active', 'activity', 'actor', 'actress', 'actually', 'ad', 'advertisement', 'add', 'address', 'admire', 'adult', 'advantage', 'advice', 'advise', 'afford', 'afraid',
  'agree', 'ahead', 'aim', 'airplane', 'airport', 'alarm', 'alive', 'allow', 'almost', 'alone', 'along', 'aloud', 'already', 'although', 'always',
  'amazing', 'among', 'ancient', 'another', 'answer', 'ant', 'anybody', 'anyone', 'anything', 'anyway', 'anywhere', 'apartment', 'app', 'application', 'appear', 'area', 'argue', 'army', 'around', 'arrive', 'article', 'artist', 'as', 'ask', 'asleep',
  'at', 'athlete', 'attack', 'attend', 'attention', 'australia', 'australian', 'autumn',
  'average', 'avoid', 'awake', 'award', 'aware', 'away', 'awful',
  'background', 'badminton', 'balance', 'balloon', 'bamboo', 'band', 'bank', 'baseball', 'basic', 'basket', 'bath', 'bathroom', 'beach', 'bean', 'bear', 'beat', 'beautiful', 'because', 'become', 'bed', 'bedroom', 'bee', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'bell', 'belong', 'below', 'belt', 'benefit', 'beside', 'besides', 'between', 'beyond', 'big', 'bike', 'bill', 'bin', 'biology', 'birth', 'biscuit', 'bit', 'bitter', 'black', 'blackboard', 'bleed', 'blind', 'block', 'blood', 'blouse', 'blow', 'blue', 'board', 'boat', 'body', 'boil', 'bomb', 'bone', 'book', 'bookshop', 'boring', 'born', 'borrow', 'boss', 'both', 'bottle', 'bottom', 'bowl', 'box', 'boy', 'brain', 'brave', 'bread', 'break', 'breakfast', 'breath', 'bridge', 'bright', 'bring', 'brother', 'brown', 'brush', 'budget', 'build', 'building', 'bully', 'burn', 'bus', 'business', 'busy', 'but', 'butter', 'butterfly', 'buy', 'by', 'bye',
  'cabbage', 'cafe', 'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'can', 'canada', 'canadian', 'cancel', 'cancer', 'candle', 'candy', 'cap', 'capital', 'car', 'card', 'care', 'careful', 'careless', 'carrot', 'carry', 'cartoon', 'case', 'cash', 'cat', 'catch', 'cause', 'celebrate', 'cent', 'central', 'centre', 'center', 'century', 'certain', 'chair', 'chalk', 'challenge', 'champion', 'chance', 'change', 'character', 'characteristic', 'charity', 'chat', 'cheap', 'cheat', 'check', 'cheek', 'cheer', 'cheese', 'chemistry', 'chess', 'chest', 'chicken', 'child', 'china', 'chinese', 'chip', 'chocolate', 'choice', 'choose', 'chopsticks', 'christmas', 'church', 'cinema', 'circle', 'citizen', 'city', 'clap', 'class', 'classic', 'classmate', 'classroom', 'clean', 'clear', 'clever', 'click', 'climate', 'climb', 'clock', 'close', 'clothes', 'cloud', 'cloudy', 'club', 'coach', 'coal', 'coast', 'coat', 'coffee', 'coin', 'cold', 'collect', 'college', 'colour', 'color', 'come', 'comfortable', 'common', 'communicate', 'community', 'company', 'compare', 'compete', 'complete', 'computer', 'concert', 'condition', 'confidence', 'congratulation', 'connect', 'consider', 'continue', 'control', 'convenient', 'conversation', 'cook', 'cookie', 'cool', 'copy', 'corn', 'corner', 'correct', 'cost', 'cotton', 'cough', 'could', 'count', 'country', 'countryside', 'couple', 'courage', 'course', 'cousin', 'cover', 'cow', 'crazy', 'create', 'creative', 'cross', 'crowded', 'cry', 'cucumber', 'culture', 'cup', 'curious', 'customer', 'cut', 'cute',
  'daily', 'dance', 'danger', 'dangerous', 'dark', 'date', 'daughter', 'day', 'dead', 'deaf', 'deal', 'dear', 'death', 'decide', 'deep', 'degree', 'delicious', 'dentist', 'depend', 'describe', 'desert', 'design', 'desk', 'develop', 'dialog', 'dialogue', 'diary', 'dictionary', 'die', 'diet', 'difference', 'different', 'difficult', 'dig', 'digital', 'dine', 'dining', 'dinner', 'direct', 'director', 'dirty', 'disappoint', 'disaster', 'discover', 'discuss', 'disease', 'dish', 'divide', 'do', 'doctor', 'dog', 'doll', 'dollar', 'donate', 'door', 'double', 'doubt', 'down', 'download', 'dragon', 'drama', 'draw', 'dream', 'dress', 'drink', 'drive', 'driver', 'drop', 'dry', 'duck', 'dumpling', 'during', 'duty',
  'each', 'eagle', 'ear', 'early', 'earth', 'earthquake', 'east', 'easy', 'eat', 'education', 'effect', 'effort', 'egg', 'eight', 'eighteen', 'eighth', 'either', 'elder', 'electric', 'electronic', 'elephant', 'eleven', 'else', 'email', 'emergency', 'emperor', 'empress', 'empty', 'encourage', 'end', 'enemy', 'energetic', 'energy', 'engineer', 'england', 'english', 'enjoy', 'enough', 'enter', 'environment', 'era', 'eraser', 'especially', 'europe', 'european', 'even', 'evening', 'event', 'ever', 'every', 'everybody', 'everyone', 'everyday', 'everything', 'everywhere', 'exact', 'exactly', 'exam', 'examination', 'example', 'excellent', 'except', 'excited', 'exciting', 'excuse', 'exercise', 'expect', 'expensive', 'experience', 'expert', 'explain', 'explore', 'express', 'eye',
  'face', 'fact', 'factory', 'fail', 'fair', 'fall', 'false', 'familiar', 'family', 'famous', 'fan', 'fantastic', 'far', 'farm', 'farmer', 'fashion', 'fast', 'fat', 'father', 'dad', 'fault', 'favourite', 'favorite', 'fear', 'feed', 'feel', 'feeling', 'festival', 'fever', 'few', 'field', 'fifteen', 'fifth', 'fifty', 'fight', 'fill', 'film', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'fireman', 'firemen', 'firework', 'first', 'fish', 'fit', 'five', 'fix', 'flag', 'flat', 'flood', 'floor', 'flower', 'flu', 'fly', 'focus', 'fog', 'folk', 'follow', 'food', 'fool', 'foot', 'feet', 'football', 'for', 'force', 'foreign', 'forest', 'forever', 'forget', 'fork', 'form', 'forty', 'forward', 'found', 'fox', 'free', 'freeze', 'fresh', 'fridge', 'refrigerator', 'friend', 'friendly', 'friendship', 'frighten', 'from', 'front', 'fruit', 'full', 'fun', 'funny', 'future',
  'game', 'garden', 'gas', 'gate', 'general', 'gentleman', 'geography', 'geometry', 'germany', 'get', 'gift', 'giraffe', 'girl', 'give', 'glad', 'glass', 'glove', 'glue', 'go', 'goal', 'gold', 'golden', 'good', 'goodbye', 'goods', 'goose', 'geese', 'government', 'grade', 'graduate', 'grammar', 'grandfather', 'grandpa', 'grandmother', 'grandma', 'grape', 'grass', 'great', 'green', 'greet', 'grey', 'gray', 'ground', 'group', 'grow', 'guard', 'guess', 'guest', 'guide', 'guitar', 'gun', 'gym', 'gymnasium',
  'habit', 'hair', 'half', 'hall', 'hamburger', 'hand', 'handbag', 'handsome', 'hang', 'happen', 'happy', 'hard', 'hardly', 'harm', 'hat', 'hate', 'have', 'has', 'he', 'head', 'headache', 'health', 'healthy', 'hear', 'heart', 'heat', 'heavy', 'height', 'hello', 'help', 'helpful', 'hen', 'her', 'here', 'hero', 'hers', 'herself', 'hi', 'hide', 'high', 'hike', 'hill', 'him', 'himself', 'his', 'history', 'hit', 'hobby', 'hold', 'hole', 'holiday', 'home', 'hometown', 'homework', 'honest', 'honey', 'honour', 'honor', 'hope', 'horse', 'hospital', 'host', 'hostess', 'hot', 'hotel', 'hour', 'house', 'housework', 'how', 'however', 'huge', 'human', 'humour', 'humor', 'hundred', 'hungry', 'hunt', 'hurry', 'hurt', 'husband',
  'i', 'ice', 'ice cream', 'idea', 'id', 'if', 'ill', 'illness', 'imagine', 'immediate', 'importance', 'important', 'impossible', 'improve', 'in', 'include', 'including', 'income', 'increase', 'indeed', 'industry', 'influence', 'information', 'insect', 'inside', 'insist', 'instead', 'instruct', 'instruction', 'instrument', 'interest', 'interesting', 'international', 'internet', 'interview', 'into', 'introduce', 'invent', 'invention', 'invitation', 'invite', 'island', 'it', 'italian', 'italy', 'its', 'itself',
  'jacket', 'jeans', 'job', 'jog', 'join', 'joke', 'journey', 'joy', 'judge', 'juice', 'july', 'jump', 'june', 'junior',
  'keep', 'key', 'keyboard', 'kick', 'kid', 'kill', 'kilo', 'kilogram', 'kilometre', 'kilometer', 'kind', 'kingdom', 'kiss', 'kitchen', 'kite', 'knee', 'knife', 'knives', 'knock', 'know', 'knowledge', 'kung fu',
  'lab', 'laboratory', 'lady', 'lake', 'lamp', 'land', 'language', 'lantern', 'laptop', 'large', 'last', 'late', 'later', 'laugh', 'law', 'lawyer', 'lay', 'lazy', 'lead', 'leader', 'leaf', 'leaves', 'learn', 'learner', 'least', 'leave', 'left', 'leg', 'lemon', 'lend', 'less', 'lesson', 'let', 'letter', 'level', 'librarian', 'library', 'lie', 'life', 'lift', 'light', 'lightning', 'like', 'likely', 'line', 'lion', 'list', 'listen', 'literature', 'little', 'live', 'lively', 'local', 'lock', 'lonely', 'long', 'look', 'lookout', 'lose', 'loss', 'lot', 'loud', 'love', 'lovely', 'low', 'luck', 'lucky', 'lunch',
  'machine', 'mad', 'madam', 'magazine', 'magic', 'main', 'mainly', 'make', 'maker', 'mall', 'man', 'men', 'manage', 'manager', 'manner', 'many', 'map', 'march', 'mark', 'market', 'marry', 'master', 'match', 'material', 'maths', 'math', 'mathematics', 'matter', 'maximum', 'may', 'maybe', 'meal', 'mean', 'meaning', 'meat', 'medal', 'medical', 'medicine', 'medium', 'media', 'meet', 'meeting', 'member', 'mention', 'menu', 'mess', 'message', 'method', 'metre', 'meter', 'middle', 'might', 'mile', 'milk', 'mind', 'mine', 'miner', 'minute', 'mirror', 'miss', 'mistake', 'mix', 'mobile', 'model', 'modern', 'moment', 'monday', 'money', 'monitor', 'monkey', 'month', 'moon', 'more', 'morning', 'most', 'mother', 'mum', 'mom', 'motorcycle', 'mountain', 'mount', 'mouse', 'mice', 'mouth', 'move', 'movie', 'mr', 'mrs', 'ms', 'much', 'museum', 'music', 'must', 'mutton', 'my', 'myself',
  'name', 'narrow', 'nation', 'national', 'nature', 'natural', 'near', 'nearby', 'nearly', 'neat', 'necessary', 'neck', 'need', 'negative', 'neighbour', 'neighbor', 'neither', 'nervous', 'never', 'new', 'news', 'newspaper', 'next', 'nice', 'night', 'nine', 'nineteen', 'ninety', 'ninth', 'no', 'noble', 'nobody', 'nod', 'noise', 'noisy', 'none', 'noodle', 'noon', 'nor', 'normal', 'north', 'northern', 'nose', 'not', 'note', 'notebook', 'nothing', 'notice', 'novel', 'now', 'nowhere', 'number', 'nurse',
  'o\'clock', 'object', 'ocean', 'october', 'of', 'off', 'offer', 'office', 'officer', 'often', 'oil', 'ok', 'okay', 'old', 'olympic', 'on', 'once', 'one', 'oneself', 'onion', 'only', 'onto', 'open', 'opera', 'operate', 'operation', 'opinion', 'opposite', 'or', 'orange', 'order', 'organise', 'organize', 'organisation', 'organization', 'other', 'others', 'ought', 'our', 'ours', 'ourselves', 'out', 'outdoor', 'outside', 'oven', 'over', 'overcoat', 'own', 'owner',
  'pack', 'packet', 'page', 'pain', 'paint', 'painting', 'pair', 'palace', 'pale', 'pan', 'pancake', 'panda', 'paper', 'paragraph', 'pardon', 'parent', 'park', 'part', 'particular', 'particularly', 'partner', 'party', 'pass', 'passage', 'passenger', 'passport', 'past', 'path', 'patient', 'pay', 'pe', 'peace', 'pear', 'pen', 'pencil', 'penguin', 'people', 'pepper', 'percent', 'per cent', 'perfect', 'perform', 'performance', 'perhaps', 'period', 'person', 'personal', 'pet', 'phone', 'photo', 'photograph', 'physics', 'piano', 'pick', 'picnic', 'picture', 'pie', 'piece', 'pig', 'pill', 'pilot', 'ping-pong', 'pink', 'pioneer', 'pity', 'pizza', 'place', 'plan', 'plane', 'planet', 'plant', 'plastic', 'plate', 'play', 'playground', 'please', 'pleasure', 'plenty', 'pm', 'pocket', 'poem', 'poet', 'point', 'police', 'policeman', 'policemen', 'policewoman', 'policewomen', 'polite', 'pollute', 'pollution', 'pool', 'poor', 'popular', 'population', 'pork', 'porridge', 'position', 'positive', 'possibility', 'possible', 'post', 'postcard', 'postman', 'postmen', 'pot', 'potato', 'pound', 'pour', 'power', 'practice', 'praise', 'prefer', 'prepare', 'present', 'president', 'press', 'pressure', 'pretty', 'price', 'pride', 'primary', 'prince', 'princess', 'print', 'printer', 'prison', 'prisoner', 'private', 'prize', 'probably', 'problem', 'produce', 'product', 'programme', 'program', 'progress', 'project', 'promise', 'pronounce', 'pronunciation', 'proper', 'protect', 'proud', 'prove', 'provide', 'public', 'publish', 'pull', 'pupil', 'punish', 'pupil', 'purple', 'purpose', 'purse', 'push', 'put',
  'quality', 'quantity', 'quarrel', 'quarter', 'queen', 'question', 'quick', 'quiet', 'quite',
  'rabbit', 'race', 'radio', 'railway', 'rain', 'rainbow', 'raise', 'rapid', 'rapidly', 'rather', 'reach', 'read', 'reader', 'ready', 'real', 'reality', 'realise', 'realize', 'really', 'reason', 'reasonable', 'receive', 'recent', 'recently', 'recognise', 'recognize', 'recommend', 'record', 'recover', 'red', 'reduce', 'refuse', 'regard', 'regret', 'regular', 'relation', 'relationship', 'relative', 'relax', 'remain', 'remember', 'remind', 'remove', 'rent', 'repair', 'repeat', 'reply', 'report', 'reporter', 'representative', 'request', 'require', 'research', 'researcher', 'respect', 'responsible', 'rest', 'restaurant', 'result', 'return', 'review', 'rice', 'rich', 'ride', 'right', 'ring', 'rise', 'risk', 'river', 'road', 'robot', 'rock', 'rocket', 'role', 'roll', 'room', 'rope', 'rose', 'rough', 'round', 'row', 'rubbish', 'rule', 'ruler', 'run', 'runner', 'rush',
  'sad', 'safe', 'safety', 'salad', 'sale', 'salt', 'same', 'sample', 'sand', 'sandwich', 'satisfaction', 'satisfy', 'saturday', 'sauce', 'sausage', 'save', 'say', 'saying', 'scare', 'scarf', 'scarves', 'school', 'schoolbag', 'science', 'scientist', 'scissors', 'score', 'screen', 'sea', 'search', 'season', 'seat', 'second', 'secret', 'secretary', 'section', 'see', 'seed', 'seek', 'seem', 'seldom', 'select', 'self', 'sell', 'seller', 'send', 'senior', 'sense', 'sensitive', 'sentence', 'separate', 'september', 'serious', 'servant', 'serve', 'service', 'set', 'seven', 'seventeen', 'seventh', 'seventy', 'several', 'severe', 'sew', 'sex', 'sexual', 'shade', 'shadow', 'shake', 'shall', 'shame', 'shape', 'share', 'shark', 'she', 'sheep', 'shelf', 'shelves', 'shine', 'ship', 'shirt', 'shock', 'shoe', 'shoot', 'shop', 'shopper', 'shopping', 'short', 'shorts', 'should', 'shoulder', 'shout', 'show', 'shower', 'shut', 'shy', 'sick', 'side', 'sigh', 'sight', 'sign', 'signal', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'simply', 'since', 'sing', 'singer', 'single', 'sir', 'sister', 'sit', 'situation', 'six', 'sixteen', 'sixth', 'sixty', 'size', 'skate', 'ski', 'skill', 'skin', 'skirt', 'sky', 'sleep', 'sleepy', 'slight', 'slow', 'small', 'smart', 'smell', 'smile', 'smoke', 'smooth', 'snack', 'snake', 'snow', 'so', 'soap', 'soccer', 'social', 'socialism', 'society', 'sock', 'sofa', 'soft', 'soil', 'soldier', 'solid', 'solve', 'some', 'somebody', 'someone', 'something', 'sometimes', 'somewhere', 'son', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound', 'soup', 'sour', 'south', 'southern', 'space', 'spare', 'speak', 'speaker', 'special', 'specialist', 'speech', 'speed', 'spell', 'spend', 'spirit', 'spoon', 'sport', 'spot', 'spread', 'spring', 'square', 'stage', 'stair', 'stairs', 'stamp', 'stand', 'standard', 'star', 'start', 'starve', 'state', 'station', 'stay', 'steal', 'steam', 'steel', 'step', 'stick', 'still', 'stomach', 'stone', 'stop', 'store', 'storm', 'story', 'straight', 'strange', 'stranger', 'strawberry', 'street', 'strength', 'strengthen', 'stress', 'strict', 'strike', 'strong', 'struggle', 'student', 'studio', 'study', 'stupid', 'style', 'subject', 'succeed', 'success', 'successful', 'such', 'sudden', 'suddenly', 'suffer', 'sugar', 'suggest', 'suggestion', 'suit', 'suitable', 'suitcase', 'suite', 'summer', 'sun', 'sunday', 'sunny', 'sunshine', 'supermarket', 'supper', 'support', 'supporter', 'suppose', 'sure', 'surely', 'surface', 'surgeon', 'surprise', 'surprising', 'surprised', 'survey', 'survive', 'survivor', 'suspect', 'swallow', 'sweater', 'sweep', 'sweet', 'swim', 'swimmer', 'switch', 'symbol',
  'table', 'tail', 'tailor', 'take', 'tale', 'talent', 'talk', 'tall', 'tank', 'tap', 'tape', 'target', 'task', 'taste', 'tasty', 'tax', 'taxi', 'tea', 'teach', 'teacher', 'team', 'teamwork', 'technology', 'teenage', 'teenager', 'telephone', 'telescope', 'television', 'tv', 'tell', 'temperature', 'temple', 'ten', 'tennis', 'tent', 'term', 'terrible', 'test', 'text', 'textbook', 'than', 'thank', 'thanks', 'that', 'the', 'theatre', 'theater', 'their', 'theirs', 'them', 'theme', 'themselves', 'then', 'there', 'therefore', 'these', 'they', 'thick', 'thin', 'thing', 'think', 'thinking', 'third', 'thirst', 'thirsty', 'thirteen', 'thirty', 'this', 'those', 'though', 'thought', 'thousand', 'thread', 'throat', 'through', 'throw', 'thunder', 'ticket', 'tidy', 'tie', 'tiger', 'tight', 'tightly', 'till', 'time', 'timetable', 'tiny', 'tired', 'title', 'to', 'toast', 'tobacco', 'today', 'toe', 'together', 'toilet', 'tokyo', 'tomato', 'tomorrow', 'ton', 'tongue', 'tonight', 'too', 'tool', 'tooth', 'teeth', 'top', 'topic', 'total', 'totally', 'touch', 'tough', 'tour', 'tourist', 'toward', 'towards', 'tower', 'town', 'toy', 'trace', 'trade', 'tradition', 'traditional', 'traffic', 'train', 'training', 'translate', 'translator', 'transport', 'travel', 'traveler', 'traveller', 'treasure', 'treat', 'treatment', 'tree', 'tremble', 'trip', 'trouble', 'trousers', 'truck', 'true', 'trust', 'truth', 'try', 't-shirt', 'tuesday', 'turkey', 'turn', 'turning', 'tv', 'twelfth', 'twelve', 'twentieth', 'twenty', 'twice', 'twin', 'twice', 'two', 'type',
  'ugly', 'umbrella', 'uncle', 'under', 'underground', 'understand', 'understanding', 'uniform', 'unit', 'unite', 'university', 'unknown', 'unless', 'until', 'up', 'upon', 'upper', 'upward', 'upstairs', 'us', 'use', 'useful', 'useless', 'user', 'usual', 'usually',
  'vacation', 'value', 'valuable', 'variety', 'various', 'vast', 'vegetable', 'vegetarian', 'version', 'very', 'victory', 'video', 'view', 'village', 'villager', 'violence', 'violent', 'violin', 'virtue', 'virus', 'visit', 'visitor', 'voice', 'volleyball', 'volume', 'voluntary', 'volunteer', 'vote', 'voyage',
  'wage', 'wait', 'waiter', 'waitress', 'wake', 'walk', 'wall', 'wallet', 'wander', 'want', 'war', 'warm', 'warmth', 'warn', 'warning', 'wash', 'waste', 'watch', 'water', 'watermelon', 'wave', 'way', 'we', 'weak', 'weakness', 'wealth', 'wealthy', 'wear', 'weather', 'website', 'wednesday', 'weed', 'week', 'weekday', 'weekend', 'weep', 'weigh', 'weight', 'welcome', 'well', 'west', 'western', 'wet', 'whale', 'what', 'whatever', 'wheel', 'when', 'whenever', 'where', 'wherever', 'whether', 'which', 'while', 'whisper', 'white', 'who', 'whole', 'whom', 'whose', 'why', 'wide', 'widely', 'widen', 'widow', 'width', 'wife', 'wives', 'wild', 'will', 'willing', 'win', 'wind', 'window', 'windy', 'wine', 'wing', 'winner', 'winter', 'wire', 'wise', 'wish', 'with', 'within', 'without', 'witness', 'wolf', 'wolves', 'woman', 'women', 'wonder', 'wonderful', 'wonderfully', 'wood', 'wooden', 'wool', 'word', 'work', 'worker', 'world', 'worldwide', 'worry', 'worse', 'worst', 'worth', 'worthwhile', 'worthy', 'would', 'wound', 'wrap', 'write', 'writer', 'writing', 'wrong',
  'x-ray',
  'yard', 'year', 'yellow', 'yes', 'yesterday', 'yet', 'yogurt', 'yoghurt', 'you', 'young', 'your', 'yours', 'yourself', 'yourselves', 'youth',
  'zero', 'zoo', 'zoom'
])

// 常见不规则动词的过去式和过去分词
const irregularVerbs = new Set([
  // be 动词
  'was', 'were', 'been', 'being',
  // have
  'had', 'having',
  // do
  'did', 'done', 'doing',
  // go
  'went', 'gone', 'going',
  // come
  'came', 'come', 'coming',
  // say
  'said', 'saying',
  // make
  'made', 'making',
  // take
  'took', 'taken', 'taking',
  // see
  'saw', 'seen', 'seeing',
  // know
  'knew', 'known', 'knowing',
  // get
  'got', 'gotten', 'getting',
  // give
  'gave', 'given', 'giving',
  // find
  'found', 'finding',
  // think
  'thought', 'thinking',
  // tell
  'told', 'telling',
  // become
  'became', 'become', 'becoming',
  // leave
  'left', 'leaving',
  // feel
  'felt', 'feeling',
  // bring
  'brought', 'bringing',
  // begin
  'began', 'begun', 'beginning',
  // keep
  'kept', 'keeping',
  // show
  'shown', 'showing',
  // hear
  'heard', 'hearing',
  // play
  'played', 'playing',
  // run
  'ran', 'running',
  // move
  'moved', 'moving',
  // live
  'lived', 'living',
  // believe
  'believed', 'believing',
  // hold
  'held', 'holding',
  // write
  'wrote', 'written', 'writing',
  // stand
  'stood', 'standing',
  // set
  'setting',
  // learn
  'learned', 'learnt', 'learning',
  // change
  'changed', 'changing',
  // lead
  'led', 'leading',
  // understand
  'understood', 'understanding',
  // watch
  'watched', 'watching',
  // follow
  'followed', 'following',
  // stop
  'stopped', 'stopping',
  // create
  'created', 'creating',
  // speak
  'spoke', 'spoken', 'speaking',
  // read
  'read', 'reading',
  // allow
  'allowed', 'allowing',
  // add
  'added', 'adding',
  // spend
  'spent', 'spending',
  // grow
  'grew', 'grown', 'growing',
  // open
  'opened', 'opening',
  // walk
  'walked', 'walking',
  // win
  'won', 'winning',
  // offer
  'offered', 'offering',
  // remember
  'remembered', 'remembering',
  // love
  'loved', 'loving',
  // consider
  'considered', 'considering',
  // appear
  'appeared', 'appearing',
  // buy
  'bought', 'buying',
  // wait
  'waited', 'waiting',
  // serve
  'served', 'serving',
  // die
  'died', 'dying',
  // send
  'sent', 'sending',
  // expect
  'expected', 'expecting',
  // build
  'built', 'building',
  // stay
  'stayed', 'staying',
  // fall
  'fell', 'fallen', 'falling',
  // cut
  'cutting',
  // reach
  'reached', 'reaching',
  // kill
  'killed', 'killing',
  // remain
  'remained', 'remaining',
  // suggest
  'suggested', 'suggesting',
  // raise
  'raised', 'raising',
  // pass
  'passed', 'passing',
  // sell
  'sold', 'selling',
  // require
  'required', 'requiring',
  // report
  'reported', 'reporting',
  // decide
  'decided', 'deciding',
  // pull
  'pulled', 'pulling'
])

// 检查是否是动词的时态形式（过去式、进行时、第三人称单数等）或名词复数
function isVerbForm(word) {
  // 检查不规则动词列表
  if (irregularVerbs.has(word)) return true

  // 检查 -ing 结尾（进行时）
  if (word.endsWith('ing')) return true

  // 检查 -ed 结尾（规则过去式/过去分词）
  // 但要排除一些本身以 -ed 结尾的原形单词
  const edExceptions = new Set([
    'red', 'bed', 'fed', 'led', 'shed', 'bleed', 'breed', 'speed', 'seed', 'need', 'deed',
    'indeed', 'blood', 'flood', 'mud', 'sud', 'nod', 'odd', 'add', 'egg', 'inn', 'arm', 'art'
  ])
  if (word.endsWith('ed') && word.length > 2 && !edExceptions.has(word)) {
    // 检查是否可能是原形单词（如 "needed" 来自 "need"）
    const base = word.slice(0, -2)
    // 如果去掉 -ed 后的词长度>=3，则认为是过去式
    if (base.length >= 3) return true
  }

  // 检查 -ies 结尾（辅音+y → ies，是复数或第三人称单数）
  if (word.endsWith('ies') && word.length > 4) {
    return true  // 如: cities, parties, stories
  }

  // 检查 -es 结尾（o/s/x/ch/sh 结尾 + es）
  if (word.endsWith('es') && word.length > 3) {
    const base = word.slice(0, -2)
    // 如果原词以 o, s, x, ch, sh 结尾，则是变化形式
    if (/[osxchsh]$/i.test(base)) return true
  }

  // 检查常规 -s 结尾（名词复数或动词第三人称单数）
  // 排除本身以 -s 结尾的原形单词
  const sExceptions = new Set([
    'bus', 'gas', 'yes', 'news', 'glass', 'grass', 'class', 'pass', 'less', 'mess',
    'cross', 'loss', 'boss', 'kiss', 'miss', 'his', 'its', 'ours', 'theirs', 'yours',
    'plus', 'thus', 'us', 'is', 'was', 'has', 'does', 'goes', 'species', 'series',
    'analysis', 'basis', 'crisis', 'thesis', 'emphasis', 'status', 'stress', 'success',
    'focus', 'canvas', 'chas', 'bias', 'alias', 'atlas', 'as', 'os'
  ])
  if (word.endsWith('s') && !sExceptions.has(word) && word.length > 4) {
    // 常规的名词复数或动词第三人称单数，如: books, cats, runs, walks
    // 如果不是例外列表中的词，且长度>4，很可能是变化形式
    return true
  }

  return false
}

// 解析CSV
const parseCsvLine = (line) => {
  const parts = line.split(',')
  return parts.map((item) => item.replace(/^"|"$/g, '').trim())
}

const lines = csvContent.split(/\r?\n/).filter(Boolean)

const allWords = []
const afterPrimary = []
const afterMiddle = []

// 跳过标题行，继续取单词直到达到目标数量
for (let i = 1; i < lines.length && afterMiddle.length < TARGET_COUNT; i++) {
  const columns = parseCsvLine(lines[i])
  const word = columns[1]?.toLowerCase().trim()
  const rank = columns[0]

  if (!word || !/^[a-z]+$/.test(word)) continue
  // 过滤掉单个字母（对于学习无意义）
  if (word.length === 1) continue
  // 过滤掉纯数字或特殊字符
  if (!/^[a-z]{2,}$/.test(word)) continue
  // 过滤掉动词时态形式（过去式、进行时、第三人称单数、复数等）
  if (isVerbForm(word)) continue

  allWords.push({ word, rank })

  // 过滤小学词汇
  if (!primarySchoolWords.has(word)) {
    afterPrimary.push({ word, rank })
  }

  // 过滤初中词汇
  if (!middleSchoolWords.has(word)) {
    afterMiddle.push({ word, rank })
  }
}

// 截取前 TARGET_COUNT 个（如果超过的话）
const finalAfterMiddle = afterMiddle.slice(0, TARGET_COUNT)
const finalAllWords = allWords.slice(0, allWords.findIndex((w, idx) => w.word === finalAfterMiddle[finalAfterMiddle.length - 1]?.word) + 1)

console.log('========== 单词分析结果 ==========')
console.log(`原始单词数量: ${finalAllWords.length}`)
console.log(`目标单词数量: ${TARGET_COUNT}`)
console.log('')
console.log('--- 过滤小学词汇后 ---')
console.log(`小学词汇数量: ${finalAllWords.length - afterPrimary.filter(w => finalAllWords.some(fw => fw.word === w.word)).length}`)
console.log(`剩余单词数量: ${afterPrimary.filter(w => finalAllWords.some(fw => fw.word === w.word)).length}`)
console.log('')
console.log('--- 过滤初中词汇后（最终结果）---')
console.log(`初中词汇数量: ${finalAllWords.length - finalAfterMiddle.length}`)
console.log(`最终单词数量: ${finalAfterMiddle.length}`)
console.log(`数据集范围: 第1名 到 第${finalAllWords[finalAllWords.length - 1]?.rank}名`)

console.log('')
console.log('========== 过滤初中词汇后 前20个单词 ==========')
finalAfterMiddle.slice(0, 20).forEach((w, i) => {
  console.log(`${i + 1}. ${w.word} (排名: ${w.rank})`)
})

console.log('')
console.log('========== 过滤初中词汇后 最后10个单词 ==========')
finalAfterMiddle.slice(-10).forEach((w, i) => {
  console.log(`${finalAfterMiddle.length - 9 + i}. ${w.word} (排名: ${w.rank})`)
})

// 导出结果
const exportPath = path.join(__dirname, '../src/data/filtered_words.json')
fs.writeFileSync(exportPath, JSON.stringify({
  words: finalAfterMiddle,
  stats: {
    targetCount: TARGET_COUNT,
    actualCount: finalAfterMiddle.length,
    totalFromDataset: finalAllWords.length,
    maxRank: finalAllWords[finalAllWords.length - 1]?.rank,
    primaryFiltered: finalAllWords.length - afterPrimary.filter(w => finalAllWords.some(fw => fw.word === w.word)).length,
    middleFiltered: finalAllWords.length - finalAfterMiddle.length
  }
}, null, 2))
console.log('')
console.log(`========== 结果已导出到 ${exportPath} ==========`)

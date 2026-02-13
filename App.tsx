
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  RefreshCw, 
  Settings, 
  History, 
  Zap, 
  Check,
  Lock,
  Cpu,
  Languages,
  Hash,
  Key,
  MousePointer2,
  Github
} from 'lucide-react';
import { PasswordOptions, PasswordStrength, LocalAnalysis, PasswordHistoryItem } from './types';
import StrengthMeter from './components/StrengthMeter';

type Language = 'zh' | 'en';
type GeneratorMode = 'password' | 'uuid';

const translations = {
  zh: {
    title: '密码生成器',
    subtitle: '100% 离线生成 · 隐私优先 · 随机加密',
    secureOutput: '安全输出',
    config: '生成配置',
    length: '字符长度',
    quantity: '生成数量',
    uppercase: '大写字母 (A-Z)',
    lowercase: '小写字母 (a-z)',
    numbers: '数字 (0-9)',
    symbols: '符号 (!@#$)',
    reGenerate: '重新生成',
    analysis: '本地分析引擎',
    crackTime: '暴力破解预估时间',
    entropy: '密码熵值',
    bits: '位',
    history: '历史记录',
    noHistory: '暂无历史',
    copied: '已复制',
    copyAll: '全部复制',
    clickToCopy: '点击复制',
    securityTips: '安全建议',
    zeroKnowledge: '零知识生成 · 绝不联网',
    modePassword: '安全密码',
    modeUuid: 'UUID 生成',
    uuidVersion: 'UUID 版本',
    uuidCase: '大写形式',
    time: {
      instant: '瞬间',
      seconds: '秒',
      minutes: '分钟',
      hours: '小时',
      days: '天',
      years: '年',
      centuries: '世纪',
      forever: '宇宙终结前无法破解'
    },
    tips: {
      length: '增加长度到 12 位以上可以极大提升安全性',
      symbols: '加入特殊符号 (!@#$) 能有效抵御字典攻击',
      numbers: '数字能打乱字符规律',
      perfect: '该密码符合最高安全准则',
      uuidInfo: 'UUID v4 基于随机数，碰撞概率极低'
    }
  },
  en: {
    title: 'Password Generator',
    subtitle: '100% Offline · Privacy First · Random encryption',
    secureOutput: 'Secure Output',
    config: 'Configuration',
    length: 'Character Length',
    quantity: 'Quantity',
    uppercase: 'Uppercase (A-Z)',
    lowercase: 'Lowercase (a-z)',
    numbers: 'Numbers (0-9)',
    symbols: 'Symbols (!@#$)',
    reGenerate: 'Regenerate',
    analysis: 'Local Analysis Engine',
    crackTime: 'Estimated Crack Time',
    entropy: 'Password Entropy',
    bits: 'bits',
    history: 'History',
    noHistory: 'No History',
    copied: 'Copied',
    copyAll: 'Copy All',
    clickToCopy: 'Click to copy',
    securityTips: 'Security Tips',
    zeroKnowledge: 'Zero Knowledge · No Internet',
    modePassword: 'Password',
    modeUuid: 'UUID Gen',
    uuidVersion: 'UUID Version',
    uuidCase: 'Uppercase',
    time: {
      instant: 'Instant',
      seconds: 'seconds',
      minutes: 'minutes',
      hours: 'hours',
      days: 'days',
      years: 'years',
      centuries: 'centuries',
      forever: 'Uncrackable before universe ends'
    },
    tips: {
      length: 'Increasing length beyond 12 significantly boosts security',
      symbols: 'Adding symbols (!@#$) resists dictionary attacks',
      numbers: 'Numbers break predictable patterns',
      perfect: 'This password meets the highest security standards',
      uuidInfo: 'UUID v4 is random-based with negligible collision risk'
    }
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('zh');
  const [mode, setMode] = useState<GeneratorMode>('password');
  const [password, setPassword] = useState('');
  const [uuids, setUuids] = useState<string[]>([]);
  
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  const [uuidOptions, setUuidOptions] = useState({
    quantity: 1,
    uppercase: false
  });

  const [strength, setStrength] = useState<PasswordStrength>('weak');
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<PasswordHistoryItem[]>([]);
  const [isCopying, setIsCopying] = useState(false);
  const [copyTargetId, setCopyTargetId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<LocalAnalysis | null>(null);

  const t = translations[lang];

  const performLocalAnalysis = (pwd: string, charsetSize: number): LocalAnalysis => {
    const entropy = pwd.length > 0 ? Math.log2(Math.pow(charsetSize, pwd.length)) : 0;
    const guessesPerSecond = 100e9; 
    const secondsToCrack = Math.pow(2, entropy) / guessesPerSecond;
    
    let timeStr = "";
    if (secondsToCrack < 1) timeStr = t.time.instant;
    else if (secondsToCrack < 60) timeStr = `${Math.floor(secondsToCrack)} ${t.time.seconds}`;
    else if (secondsToCrack < 3600) timeStr = `${Math.floor(secondsToCrack / 60)} ${t.time.minutes}`;
    else if (secondsToCrack < 86400) timeStr = `${Math.floor(secondsToCrack / 3600)} ${t.time.hours}`;
    else if (secondsToCrack < 31536000) timeStr = `${Math.floor(secondsToCrack / 86400)} ${t.time.days}`;
    else if (secondsToCrack < 3153600000) timeStr = `${Math.floor(secondsToCrack / 31536000)} ${t.time.years}`;
    else if (secondsToCrack < 3153600000000) timeStr = `${Math.floor(secondsToCrack / 3153600000)} ${t.time.centuries}`;
    else timeStr = t.time.forever;

    const tips = [];
    if (pwd.length < 12) tips.push(t.tips.length);
    if (!/[^A-Za-z0-9]/.test(pwd)) tips.push(t.tips.symbols);
    if (!/[0-9]/.test(pwd)) tips.push(t.tips.numbers);
    if (tips.length === 0) tips.push(t.tips.perfect);

    return { entropy, crackingTime: timeStr, tips };
  };

  const generateUUID = () => {
    const newUuids = [];
    for (let i = 0; i < uuidOptions.quantity; i++) {
      let u = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      if (uuidOptions.uppercase) u = u.toUpperCase();
      newUuids.push(u);
    }
    setUuids(newUuids);
    
    const newItem: PasswordHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      value: newUuids[0],
      createdAt: Date.now(),
    };
    setHistory(prev => [newItem, ...prev].slice(0, 5));
  };

  const generatePassword = useCallback(() => {
    setIsGenerating(true);
    
    if (mode === 'uuid') {
      generateUUID();
      setTimeout(() => setIsGenerating(false), 300);
      return;
    }

    const { length, includeUppercase, includeLowercase, includeNumbers, includeSymbols } = options;
    
    const CHAR_SETS = {
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lower: 'abcdefghijklmnopqrstuvwxyz',
      nums: '0123456789',
      syms: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    };

    let charset = '';
    const mandatoryChars: string[] = [];

    // 辅助函数：从指定字符串中随机获取一个字符
    const getRandomFromSet = (set: string) => {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return set[array[0] % set.length];
    };

    // 1. 构建字符集并收集必含字符
    if (includeUppercase) {
      charset += CHAR_SETS.upper;
      mandatoryChars.push(getRandomFromSet(CHAR_SETS.upper));
    }
    if (includeLowercase) {
      charset += CHAR_SETS.lower;
      mandatoryChars.push(getRandomFromSet(CHAR_SETS.lower));
    }
    if (includeNumbers) {
      charset += CHAR_SETS.nums;
      mandatoryChars.push(getRandomFromSet(CHAR_SETS.nums));
    }
    if (includeSymbols) {
      charset += CHAR_SETS.syms;
      mandatoryChars.push(getRandomFromSet(CHAR_SETS.syms));
    }

    if (charset === '') {
      setPassword('');
      setStrength('weak');
      setScore(0);
      setAnalysis(null);
      setIsGenerating(false);
      return;
    }

    // 2. 填充剩余长度
    const result: string[] = [...mandatoryChars];
    const remainingLength = Math.max(0, length - mandatoryChars.length);
    
    if (remainingLength > 0) {
      const array = new Uint32Array(remainingLength);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < remainingLength; i++) {
        result.push(charset[array[i] % charset.length]);
      }
    }

    // 3. 洗牌 (Fisher-Yates) 确保必含字符位置随机
    for (let i = result.length - 1; i > 0; i--) {
      const jArray = new Uint32Array(1);
      window.crypto.getRandomValues(jArray);
      const j = jArray[0] % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }

    // 4. 截断或取最终结果 (防止长度设置小于必选集数量)
    const finalPassword = result.slice(0, length).join('');

    setPassword(finalPassword);
    
    // 计算强度得分
    let s = 0;
    if (finalPassword.length >= 8) s += 20;
    if (finalPassword.length >= 12) s += 15;
    if (finalPassword.length >= 20) s += 15;
    if (/[A-Z]/.test(finalPassword)) s += 10;
    if (/[a-z]/.test(finalPassword)) s += 10;
    if (/[0-9]/.test(finalPassword)) s += 15;
    if (/[^A-Za-z0-9]/.test(finalPassword)) s += 15;

    setScore(s);
    if (s < 40) setStrength('weak');
    else if (s < 60) setStrength('fair');
    else if (s < 80) setStrength('good');
    else if (s < 95) setStrength('strong');
    else setStrength('legendary');

    setAnalysis(performLocalAnalysis(finalPassword, charset.length));
    
    const newItem: PasswordHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      value: finalPassword,
      createdAt: Date.now(),
    };
    setHistory(prev => [newItem, ...prev].slice(0, 5));
    
    setTimeout(() => setIsGenerating(false), 300);
  }, [options, uuidOptions, mode, lang]);

  const handleCopy = async (text: string, id: string = 'main') => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopying(true);
      setCopyTargetId(id);
      setTimeout(() => {
        setIsCopying(false);
        setCopyTargetId(null);
      }, 2000);
    } catch (err) {}
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(uuids.join('\n'));
      setIsCopying(true);
      setCopyTargetId('all');
      setTimeout(() => {
        setIsCopying(false);
        setCopyTargetId(null);
      }, 2000);
    } catch (err) {}
  };

  useEffect(() => {
    generatePassword();
  }, [mode, lang]);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 selection:bg-indigo-500/30">
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <a
          href="https://github.com/Yecraft2025/Password-Generator"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-xs font-medium text-gray-400 hover:text-white"
          title="GitHub Repository"
        >
        <Github className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Source Code</span>
        </a>
      </div>
      <div className="absolute top-4 right-4 md:top-8 md:right-8">
        <button 
          onClick={() => setLang(prev => prev === 'zh' ? 'en' : 'zh')}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-xs font-medium text-gray-400 hover:text-white"
        >
          <Languages className="w-3.5 h-3.5" />
          {lang === 'zh' ? 'English' : '简体中文'}
        </button>
      </div>

      <header className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 mb-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
          <Lock className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          {t.title} <span className="text-emerald-400">Local</span>
        </h1>
        <p className="mt-2 text-gray-500 text-sm max-w-xs md:max-w-md mx-auto">{t.subtitle}</p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 模式切换 */}
          <div className="flex p-1 bg-gray-900/60 rounded-2xl border border-gray-800">
            <button 
              onClick={() => setMode('password')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${mode === 'password' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Key className="w-4 h-4" />
              <span className="text-sm font-semibold">{t.modePassword}</span>
            </button>
            <button 
              onClick={() => setMode('uuid')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${mode === 'uuid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Hash className="w-4 h-4" />
              <span className="text-sm font-semibold">{t.modeUuid}</span>
            </button>
          </div>

          {/* 展示区 */}
          <section className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{t.secureOutput}</span>
              <div className="flex items-center gap-2">
                {mode === 'uuid' && uuids.length > 1 && (
                  <button onClick={handleCopyAll} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded-lg hover:bg-white/5 transition-all">
                    {copyTargetId === 'all' ? t.copied : t.copyAll}
                  </button>
                )}
                <button onClick={generatePassword} className="text-gray-500 hover:text-white transition-colors p-1" title={t.reGenerate}>
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="relative group mb-6">
              <div 
                onClick={() => mode === 'password' ? handleCopy(password) : null}
                className={`w-full bg-black/40 border border-gray-800 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center min-h-[110px] transition-all group-hover:border-indigo-500/30 ${mode === 'password' ? 'cursor-pointer hover:bg-black/60' : ''}`}
                title={mode === 'password' ? t.clickToCopy : ''}
              >
                {mode === 'password' ? (
                  <>
                    <p className="text-2xl md:text-3xl font-mono-custom break-all text-center tracking-wider text-white">
                      {password || '••••••••'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-gray-600 group-hover:text-indigo-400 transition-colors">
                      <MousePointer2 className="w-3 h-3" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">{t.clickToCopy}</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar px-2 py-1">
                    {uuids.map((u, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleCopy(u, `uuid-${i}`)}
                        className="flex items-center justify-between group/item p-2.5 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-gray-800 cursor-pointer"
                        title={t.clickToCopy}
                      >
                        <span className="text-sm md:text-base font-mono-custom text-gray-300 break-all">{u}</span>
                        <div className="flex items-center gap-2">
                          {copyTargetId === `uuid-${i}` && <span className="text-[10px] text-emerald-400 font-bold">{t.copied}</span>}
                          <Copy className={`w-3.5 h-3.5 transition-all ${copyTargetId === `uuid-${i}` ? 'text-emerald-400 scale-110' : 'text-gray-500 group-hover/item:text-white'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {mode === 'password' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCopy(password); }}
                  className="absolute top-3 right-3 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  {isCopying && copyTargetId === 'main' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
              
              {isCopying && copyTargetId === 'main' && mode === 'password' && (
                <div className="absolute -top-10 right-3 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full animate-bounce">
                  {t.copied}
                </div>
              )}
            </div>

            {mode === 'password' && <StrengthMeter strength={strength} score={score} />}
          </section>

          {/* 配置区 */}
          <section className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-8">
              <Settings className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold">{t.config}</h2>
            </div>

            {mode === 'password' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-400">{t.length}</label>
                    ?
                    <input
                        type="number"
                        min="4"
                        max="64"
                        value={options.length}
                        onChange={(e) => {
                        const val = Math.max(4, Math.min(64, parseInt(e.target.value) || 4));
                        setOptions({ ...options, length: val });
                        }}
                        className="w-16 bg-transparent border-b border-gray-700 text-indigo-400 font-mono-custom font-bold text-lg text-right focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                  </div>
                  <input 
                    type="range" min="4" max="64" value={options.length}
                    onChange={(e) => setOptions({...options, length: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'u', label: t.uppercase, key: 'includeUppercase' },
                    { id: 'l', label: t.lowercase, key: 'includeLowercase' },
                    { id: 'n', label: t.numbers, key: 'includeNumbers' },
                    { id: 's', label: t.symbols, key: 'includeSymbols' },
                  ].map((item) => (
                    <label key={item.id} className="flex items-center justify-between p-4 bg-gray-800/20 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-800/40 transition-all">
                      <span className="text-sm text-gray-300">{item.label}</span>
                      <input 
                        type="checkbox" 
                        checked={options[item.key as keyof PasswordOptions] as boolean}
                        onChange={() => setOptions({...options, [item.key]: !options[item.key as keyof PasswordOptions]})}
                        className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-0"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                 <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-400">{t.quantity}</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={uuidOptions.quantity}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
                        setUuidOptions({ ...uuidOptions, quantity: val });
                      }}
                      className="w-16 bg-transparent border-b border-gray-700 text-indigo-400 font-mono-custom font-bold text-lg text-right focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={uuidOptions.quantity}
                    onChange={(e) => setUuidOptions({...uuidOptions, quantity: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-800/20 border border-gray-800 rounded-2xl flex items-center justify-between">
                    <span className="text-sm text-gray-300">{t.uuidVersion}</span>
                    <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">V4 (Random)</span>
                  </div>
                  <label className="flex items-center justify-between p-4 bg-gray-800/20 border border-gray-800 rounded-2xl cursor-pointer hover:bg-gray-800/40 transition-all">
                    <span className="text-sm text-gray-300">{t.uuidCase}</span>
                    <input 
                      type="checkbox" 
                      checked={uuidOptions.uppercase}
                      onChange={() => setUuidOptions({...uuidOptions, uppercase: !uuidOptions.uppercase})}
                      className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            )}

            <button 
              onClick={generatePassword}
              className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
            >
              <Zap className="w-4 h-4" /> {t.reGenerate}
            </button>
          </section>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          <section className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">{t.analysis}</h2>
            </div>
            
            <div className="space-y-4">
              {mode === 'password' ? (
                <>
                  <div className="p-4 bg-black/20 rounded-2xl">
                    <span className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wider">{t.crackTime}</span>
                    <p className="text-lg font-bold text-white">{analysis?.crackingTime}</p>
                  </div>
                  <div className="p-4 bg-black/20 rounded-2xl">
                    <span className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wider">{t.entropy}</span>
                    <p className="text-lg font-mono-custom text-white">{analysis?.entropy.toFixed(1)} <span className="text-xs font-sans text-gray-500">{t.bits}</span></p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-500 block font-bold uppercase tracking-widest mb-1">{t.securityTips}</span>
                    {analysis?.tips.map((tip, idx) => (
                      <div key={idx} className="flex gap-2 text-[11px] text-gray-400 leading-relaxed">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-black/20 rounded-2xl">
                    <span className="text-[10px] text-gray-500 block mb-1 uppercase tracking-wider">GUID / UUID</span>
                    <p className="text-xs text-gray-300 leading-relaxed">Universally Unique Identifier</p>
                  </div>
                  <div className="flex gap-2 text-[11px] text-gray-400 leading-relaxed">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>{t.tips.uuidInfo}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold">{t.history}</h2>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleCopy(item.value, item.id)}
                  className="flex items-center justify-between p-2.5 bg-black/20 rounded-xl border border-gray-800 group cursor-pointer hover:border-gray-600 transition-all"
                  title={t.clickToCopy}
                >
                  <span className="text-[10px] font-mono-custom text-gray-500 truncate pr-2">{item.value}</span>
                  <div className="flex items-center gap-1.5">
                    {copyTargetId === item.id && <span className="text-[8px] text-emerald-400 font-bold uppercase">{t.copied}</span>}
                    <Copy className={`w-3 h-3 transition-colors ${copyTargetId === item.id ? 'text-emerald-400' : 'text-gray-500 group-hover:text-white'}`} />
                  </div>
                </div>
              ))}
              {history.length === 0 && <p className="text-[10px] text-gray-600 italic text-center py-4">{t.noHistory}</p>}
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-12 py-6 text-center text-gray-600">
        <div className="flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em]">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          {t.zeroKnowledge}
        </div>
        <div className="flex justify-center">
            <a
              href="https://github.com/Yecraft2025/Password-Generator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-gray-700 hover:text-indigo-400 transition-colors flex items-center gap-1 font-mono-custom"
            >
              <span>GITHUB.COM/YECRAFT2025/PASSWORD-GENERATOR</span>
            </a>
          </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}</style>
    </div>
  );
};

export default App;

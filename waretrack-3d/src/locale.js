// Translate built-in demo text from older saves without rewriting user data.
const demoTerms = [
  ['Riverside Hub', '河畔物流中心'],
  ['Northgate DC', '北门分拨中心'],
  ['Eastport Cold Chain', '东港冷链中心'],
  ['Southfield Cross-Dock', '南区交叉转运站'],
  ['Westgate Robotics Hub', '西门智能仓'],
  ['Atlas Retail', '阿特拉斯零售'],
  ['Sunvale Grocers', '阳谷生鲜'],
  ['Metro Supply', '都市供应链'],
  ['Philadelphia, PA', '宾夕法尼亚州费城'],
  ['Jersey City, NJ', '新泽西州泽西市'],
  ['New York, NY', '纽约州纽约市'],
  ['Newark, NJ', '新泽西州纽瓦克市'],
  ['标准纸箱 · M', '标准纸箱 · 中号'],
  ['LED 照明面板', '发光二极管照明面板'],
  ['WareTrack', '仓流智控'],
  ['Bluepeak', '蓝峰物流'],
  ['Nordline', '北线物流'],
  ['Cargowave', '货浪物流'],
];

const demoNames = new Map(demoTerms);
export const demoText = value => demoNames.get(value) ?? value;
export const eventText = value => demoTerms.reduce((text, [en, zh]) => text.replaceAll(en, zh), value);

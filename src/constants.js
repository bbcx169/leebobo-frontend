export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzf8kJ6Ka8yGabg--MCRJ8eyucBbsGRDbceGEeH-CQDLqOMXhTCysZVrPKL0MLpSg4L/exec';

export const products = [
  { id: 1, name: '蕃茄 (小/喜糖)', price: 20, tags: ['婚禮小物', '小巧可愛'], description: '飽滿紅番茄裹上晶瑩糖漿，這份「永結同心」糖葫蘆，將甜蜜祝福封存。紅心貼紙耀眼奪目，寓意新人幸福圓滿。願每一對新人愛情如蜜，永結同心。', image: 'https://lh3.googleusercontent.com/d/1wKiFdk5B--qTiH3W6oMMXNr3C7iJpvM5?auto=format&fit=crop&q=80&w=400' },
  { id: 2, name: '蕃茄蜜餞 (小/喜糖)', price: 25, tags: ['婚禮小物', '酸甜夾心'], description: '「甜蜜相伴」囍悅伴手禮，精選古早味糖葫蘆，囍字紅心裹住溫馨。紅果黑棗冰糖，多層次美味。願新人一生，皆是蜜意相伴。', image: 'https://lh3.googleusercontent.com/d/1xCGWybb12VcnylRQOCPAOJUqOlqLEyAn?auto=format&fit=crop&q=80&w=400' },
  { id: 3, name: '鳥梨 (小/喜糖)', price: 20, tags: ['婚禮小物', '傳統風味', '季節限定'], description: '選用圓潤晶瑩的糖葫蘆，象徵生活圓滿、幸福長久。外層脆糖如蜜，裹住酸甜果實，每一口都是愛情的滋味。讓這份「鸞鳳和鳴」的經典雅致，伴隨賓客分享新人的喜悅，延續最真摯的甜蜜約定。', image: 'https://lh3.googleusercontent.com/d/17ECaO0J7Skz9DJCpTHJ2rbIJTXL10NJ1?auto=format&fit=crop&q=80&w=400' },
  { id: 4, name: '蕃茄+鳥梨 (小/喜糖)', price: 20, tags: ['婚禮小物', '雙重享受', '季節限定'], description: '一顆蕃茄搭配一顆鳥梨，兩種經典口味一次擁有。將紅通通的番茄與圓潤鳥梨包裹在琥珀色的糖霜中，象徵「佳偶天成」。以此傳遞圓滿的喜悅，感謝賓客與我們共度這份如糖般珍貴的幸福時刻。', image: 'https://lh3.googleusercontent.com/d/1U9dZfNU9iUQp30qPTb7uaZD6rcHjPKc0?auto=format&fit=crop&q=80&w=400' },
  { id: 5, name: '承租掃帚', price: 2000, tags: ['特色造型', '喜慶'], description: '可承租掃帚(只租不賣)保護套+掃帚為一組\n掃帚上僅可插糖葫蘆，請勿插置其他物品避免損壞\n竹稻草租金$200元 / 押金$1800元\n※歸還時若發現(保護套+掃帚)其一有毀損，則扣$1000元', image: 'https://lh3.googleusercontent.com/d/1HXXgcdfFFvIwCNEF4ETVKYwK6gYA39Tt?auto=format&fit=crop&q=80&w=400' },
  { id: 6, name: '蕃茄', price: 30, tags: ['經典必吃'], description: '傳承古法手工熬製，金黃糖衣薄脆不黏牙，包裹優選鮮果，口口香甜多汁。完美呈現外脆內軟的經典滋味，快來攤位帶走這份紅亮誘人的傳統甜蜜！', image: 'https://lh3.googleusercontent.com/d/1HGqX5CBSbDzPfTpm7eJ4BasLfUOSy8Sc?auto=format&fit=crop&q=80&w=400' },
  { id: 7, name: '蕃茄蜜餞', price: 35, tags: ['人氣首選'], description: '古法熬製糖衣薄脆不黏牙，包裹多汁蕃茄與鹹甜蜜餞。咬下瞬間，金黃糖衣與鮮果層次迸發，酸甜解膩且外脆內軟。這份傳承傳統的手工滋味，是絕不能錯過的紅亮誘惑，快來攤位品嚐！', image: 'https://lh3.googleusercontent.com/d/1FTgNOznOCkeVxHzOsFfTX9kFnGdXgDv1?auto=format&fit=crop&q=80&w=400' },
  { id: 8, name: '鳥梨', price: 35, tags: ['傳統風味', '季節限定'], description: '重溫夜市經典！嚴選優質鳥梨，遵循古法手工熬製糖衣，金黃外殼亮麗酥脆，果肉酸甜回甘且質地軟嫩。咬下一口，讓這份最道地的傳統風味，帶您回味童年園遊會的單純美好！', image: 'https://lh3.googleusercontent.com/d/146FTkRZCHmSgH3RKanKy4xMvErZoRWt-?auto=format&fit=crop&q=80&w=400' }
];

export const initialFormData = {
  eventType: '', ordererName: '', ordererPhone: '', ordererEmail: '', recipientName: '', recipientPhone: '',
  deliveryCity: '', weddingDate: '', weddingTime: '', weddingRestaurant: '', weddingHall: '',
  weddingAddress: '', groomName: '', groomPhone: '', brideName: '', bridePhone: '',
  generalDate: '', generalTime: '', generalLocation: '', generalAddress: '', notes: ''
};
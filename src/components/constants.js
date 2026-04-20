// src/constants.js

// 表單初始狀態設定
export const initialFormData = {
  name: '',
  phone: '',
  email: '',
  eventDate: '',
  deliveryTime: '',
  eventType: '',
  restaurantName: '', 
  hallName: '',       
  coupleName: '',     
  recipientName: '',
  recipientPhone: '',
  deliveryCity: '',
  address: '',
  remarks: ''
};

// 產品列表
export const products = [
  {
    id: 1,
    name: "蕃茄 (小/喜糖)",
    price: 20,
    image: "https://images.unsplash.com/photo-1596484552993-9c8dfebfa9a1?q=80&w=600&auto=format&fit=crop", // 請替換為您的實際商品圖片路徑
    tags: ["婚禮小物", "小巧可愛"],
    description: "飽滿紅蕃茄裹上晶瑩糖漿，這份「永結同心」糖葫蘆，將甜蜜祝福封存。紅心貼紙耀眼奪目，寓意新人幸福圓滿。願每一對新人愛情如蜜，永結同心。"
  },
  {
    id: 2,
    name: "蕃茄蜜餞 (小/喜糖)",
    price: 25,
    image: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?q=80&w=600&auto=format&fit=crop",
    tags: ["婚禮小物", "酸甜夾心"],
    description: "「甜蜜相伴」囍悅伴手禮，精選古早味糖葫蘆，囍字紅心裹住溫馨。紅果黑棗冰糖，多層次美味。願新人一生，皆是蜜意相伴。"
  },
  {
    id: 3,
    name: "鳥梨 (小/喜糖)",
    price: 20,
    image: "https://images.unsplash.com/photo-1518057111178-44a106bad636?q=80&w=600&auto=format&fit=crop",
    tags: ["婚禮小物", "傳統風味", "季節限定"],
    description: "選用圓潤晶瑩的糖葫蘆，象徵生活圓滿、幸福長久。外層脆糖如蜜，裹住酸甜果實，每一口都是愛情的滋味。讓這份「鸞鳳和鳴」的經典雅致，伴隨賓客分享新人的喜悅，延續最真摯的甜蜜約定。"
  },
  {
    id: 4,
    name: "蕃茄+鳥梨 (小/喜糖)",
    price: 20,
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=600&auto=format&fit=crop",
    tags: ["婚禮小物", "雙重享受", "季節限定"],
    description: "一顆蕃茄搭配一顆鳥梨，兩種經典口味一次擁有。將紅通通的蕃茄與圓潤鳥梨包裹在琥珀色的糖霜中，象徵「佳偶天成」。以此傳遞圓滿的喜悅，感謝賓客與我們共度這份如糖般珍貴的幸福時刻。"
  },
  {
    id: 5,
    name: "蕃茄",
    price: 30,
    image: "https://images.unsplash.com/photo-1560155016-bd4879ae8f21?q=80&w=600&auto=format&fit=crop",
    tags: ["經典必吃"],
    description: "傳承古法手工熬製，金黃糖衣薄脆不黏牙。包裹嚴選鮮果，口口香甜多汁。"
  },
  {
    id: 6,
    name: "蕃茄蜜餞",
    price: 35,
    image: "https://images.unsplash.com/photo-1628294895950-9805252327bc?q=80&w=600&auto=format&fit=crop",
    tags: ["人氣首選"],
    description: "古法熬製糖衣薄脆不黏牙，包裹多汁蕃茄與酸甜蜜餞。咬下瞬間，金黃糖衣與果香交織。"
  },
  {
    id: 7,
    name: "鳥梨",
    price: 35,
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=600&auto=format&fit=crop",
    tags: ["傳統風味", "季節限定"],
    description: "重溫夜市經典！嚴選優質鳥梨，遵循古法手工熬製糖衣，金黃外殼亮麗酥脆。"
  },
  {
    id: 99, 
    name: "承租掃帚",
    price: 2000,
    image: "https://images.unsplash.com/photo-1585073426768-202970fa070d?q=80&w=600&auto=format&fit=crop", 
    tags: ["特色造型", "喜慶"],
    description: "可承租掃帚(只租不賣)保護套+掃帚為一組。為活動增添傳統復古氛圍！\n含租金 NT$200 與押金 NT$1,800。\n活動結束且無毀損歸還後，即退還押金。\n※ 請勿插置糖葫蘆以外之異物。"
  }
];
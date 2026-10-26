import ryzenImage from '../assets/ryzen-7-7800x3d.jpg'
import intelImage from '../assets/intel-core-i9-14900k.jpg'

export const mockGoods = [
  {
    id: 'amd-ryzen-7-7800x3d',
    category: 'CPU',
    brand: 'AMD RYZEN 7000',
    name: 'AMD Ryzen 7 7800X3D',
    description: '4.2GHz Up to 5.0GHz, 8C/16T, Socket AM5',
    image: ryzenImage,
    price: 14900,
    originalPrice: 16900,
    stock: 'พร้อมจัดส่ง',
    stockCount: 3,
    warranty: 'ประกัน SVOA / Synnex 3 ปี',
    specs: ['8 Cores / 16 Threads', 'Up to 5.0 GHz', '96MB 3D V-Cache', 'Socket AM5 | 120W'],
    badge: 'ขายดี',
  },
  {
    id: 'intel-core-i9-14900k',
    category: 'CPU',
    brand: 'INTEL 14TH GEN',
    name: 'Intel Core i9-14900K',
    description: '3.2GHz Up to 6.0GHz, 24C/32T, LGA1700',
    image: intelImage,
    price: 21900,
    originalPrice: 23900,
    stock: 'พร้อมจัดส่ง',
    stockCount: 5,
    warranty: 'ประกัน Synnex 3 ปี',
    specs: ['24 Cores (8P+16E) / 32T', 'Up to 6.0 GHz Max Turbo', '36MB Intel Smart Cache', 'LGA1700 | UHD 770'],
    badge: 'ราคาพิเศษ',
  },
]
// Presentation data only. Availability and final prices come from the booking API.
export const photo = (id, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
export const homeData = {
  hero: photo("photo-1611892440504-42a792e24d32", 2400),
  rooms: [
    {
      id: "classic",
      name: "Siam Classic",
      type: "Classic",
      caption: "A little room to slow down.",
      price: 2400,
      size: 32,
      guests: 2,
      image: photo("photo-1611892440504-42a792e24d32"),
    },
    {
      id: "deluxe",
      name: "Deluxe River View",
      type: "Deluxe",
      caption: "Wake up to a softer city.",
      price: 3200,
      size: 42,
      guests: 2,
      image: photo("photo-1590490360182-c33d57733427"),
    },
    {
      id: "suite",
      name: "Heritage Suite",
      type: "Suite",
      caption: "Space for your own rhythm.",
      price: 4500,
      size: 64,
      guests: 4,
      image: photo("photo-1566665797739-1674de7a421a"),
    },
  ],
  places: [
    {
      name: "By the river",
      thai: "บรรยากาศริมน้ำ",
      image: photo("photo-1510414842594-a61c69b5ae57"),
      icon: "waves",
      description:
        "พักสายตาและปล่อยเวลาให้เดินช้าลงริมสายน้ำ สำรวจกรุงเทพฯ ในจังหวะของคุณเอง",
    },
    {
      name: "The old town",
      thai: "เสน่ห์เมืองเก่า",
      image: photo("photo-1528181304800-259b08848526"),
      icon: "landmark",
      description: "ค้นพบสถาปัตยกรรม วัฒนธรรม และเรื่องราวเล็ก ๆ ในย่านเก่าของกรุงเทพฯ",
    },
    {
      name: "A taste of Bangkok",
      thai: "รสชาติของกรุงเทพฯ",
      image: photo("photo-1552566626-52f8b828add9"),
      icon: "coffee",
      description:
        "เริ่มวันด้วยกาแฟสักแก้ว แล้วออกไปค้นหาร้านอาหารและรสชาติใหม่ ๆ รอบเมือง",
    },
  ],
};

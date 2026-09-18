-- ============================================================
-- Optio Menu — Seed Data
-- Run AFTER 001_schema.sql
-- ============================================================

INSERT INTO business_types (name) VALUES
  ('{"en":"Restaurant","ja":"レストラン","zh":"餐厅","ko":"레스토랑","fr":"Restaurant","de":"Restaurant","es":"Restaurante","it":"Ristorante","pt":"Restaurante","ar":"مطعم","hi":"रेस्तरां","th":"ร้านอาหาร","vi":"Nhà hàng","id":"Restoran","ms":"Restoran"}'),
  ('{"en":"Café","ja":"カフェ","zh":"咖啡馆","ko":"카페","fr":"Café","de":"Café","es":"Cafetería","it":"Caffè","pt":"Café","ar":"مقهى","hi":"कैफे","th":"คาเฟ่","vi":"Quán cà phê","id":"Kafe","ms":"Kafe"}'),
  ('{"en":"Bar","ja":"バー","zh":"酒吧","ko":"바","fr":"Bar","de":"Bar","es":"Bar","it":"Bar","pt":"Bar","ar":"حانة","hi":"बार","th":"บาร์","vi":"Quán bar","id":"Bar","ms":"Bar"}'),
  ('{"en":"Bakery","ja":"ベーカリー","zh":"面包店","ko":"베이커리","fr":"Boulangerie","de":"Bäckerei","es":"Panadería","it":"Panetteria","pt":"Padaria","ar":"مخبز","hi":"बेकरी","th":"เบเกอรี่","vi":"Tiệm bánh","id":"Toko Roti","ms":"Kedai Roti"}'),
  ('{"en":"Food Truck","ja":"フードトラック","zh":"餐车","ko":"푸드트럭","fr":"Food Truck","de":"Food Truck","es":"Camión de comida","it":"Food Truck","pt":"Caminhão de comida","ar":"شاحنة طعام","hi":"फूड ट्रक","th":"ฟู้ดทรัค","vi":"Xe tải thức ăn","id":"Food Truck","ms":"Trak Makanan"}'),
  ('{"en":"Izakaya","ja":"居酒屋","zh":"居酒屋","ko":"이자카야","fr":"Izakaya","de":"Izakaya","es":"Izakaya","it":"Izakaya","pt":"Izakaya","ar":"إيزاكايا","hi":"इज़ाकाया","th":"อิซากายะ","vi":"Izakaya","id":"Izakaya","ms":"Izakaya"}'),
  ('{"en":"Ramen Shop","ja":"ラーメン屋","zh":"拉面店","ko":"라멘 가게","fr":"Ramen","de":"Ramen-Shop","es":"Ramen","it":"Ramen","pt":"Ramen","ar":"رامين","hi":"रेमन","th":"ร้านราเมน","vi":"Tiệm mì ramen","id":"Toko Ramen","ms":"Kedai Ramen"}'),
  ('{"en":"Sushi Bar","ja":"寿司屋","zh":"寿司吧","ko":"스시 바","fr":"Bar à Sushis","de":"Sushi-Bar","es":"Bar de Sushi","it":"Sushi Bar","pt":"Bar de Sushi","ar":"بار السوشي","hi":"सुशी बार","th":"ซูชิบาร์","vi":"Quán sushi","id":"Bar Sushi","ms":"Bar Sushi"}'),
  ('{"en":"Pizza Place","ja":"ピザ屋","zh":"比萨店","ko":"피자집","fr":"Pizzeria","de":"Pizzeria","es":"Pizzería","it":"Pizzeria","pt":"Pizzaria","ar":"بيتزا","hi":"पिज़्ज़ा","th":"ร้านพิซซ่า","vi":"Tiệm pizza","id":"Tempat Pizza","ms":"Kedai Pizza"}'),
  ('{"en":"Dessert Shop","ja":"デザートショップ","zh":"甜品店","ko":"디저트 가게","fr":"Salon de desserts","de":"Dessertladen","es":"Pastelería","it":"Pasticceria","pt":"Confeitaria","ar":"محل حلويات","hi":"मिठाई की दुकान","th":"ร้านขนมหวาน","vi":"Tiệm tráng miệng","id":"Toko Dessert","ms":"Kedai Pencuci Mulut"}'),
  ('{"en":"Other","ja":"その他","zh":"其他","ko":"기타","fr":"Autre","de":"Sonstiges","es":"Otro","it":"Altro","pt":"Outro","ar":"أخرى","hi":"अन्य","th":"อื่นๆ","vi":"Khác","id":"Lainnya","ms":"Lain-lain"}')
ON CONFLICT DO NOTHING;

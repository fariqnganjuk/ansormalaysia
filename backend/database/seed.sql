USE ansormalaysia_app;

INSERT INTO organizations (name, description, logo_url, type)
VALUES
  ('PCINU Malaysia', 'Pengurus Cabang Istimewa Nahdlatul Ulama Malaysia.', NULL, 'PCINU')
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  logo_url = VALUES(logo_url),
  type = VALUES(type);

INSERT INTO infographics (title, description, image_url, location_name, latitude, longitude, data_value, data_type)
VALUES
  ('Data PMI Selangor', 'Jumlah Pekerja Migran Indonesia di Selangor', 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800', 'Selangor', 3.0738, 101.5183, 45000, 'jumlah_pmi'),
  ('Data PMI Kuala Lumpur', 'Jumlah Pekerja Migran Indonesia di Kuala Lumpur', 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800', 'Kuala Lumpur', 3.1390, 101.6869, 28000, 'jumlah_pmi'),
  ('Data PMI Johor', 'Jumlah Pekerja Migran Indonesia di Johor', 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800', 'Johor', 1.4854, 103.7618, 32000, 'jumlah_pmi'),
  ('Data PMI Penang', 'Jumlah Pekerja Migran Indonesia di Penang', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 'Penang', 5.4164, 100.3327, 18000, 'jumlah_pmi'),
  ('Data PMI Sabah', 'Jumlah Pekerja Migran Indonesia di Sabah', 'https://images.unsplash.com/photo-1551244072-5d12893278ab?w=800', 'Sabah', 5.9788, 116.0753, 52000, 'jumlah_pmi'),
  ('Data PMI Sarawak', 'Jumlah Pekerja Migran Indonesia di Sarawak', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', 'Sarawak', 1.5533, 110.3593, 38000, 'jumlah_pmi'),
  ('Kasus Hukum Selangor', 'Jumlah kasus hukum PMI di Selangor', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800', 'Selangor', 3.0738, 101.5183, 145, 'kasus_hukum'),
  ('Kasus Hukum Johor', 'Jumlah kasus hukum PMI di Johor', 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800', 'Johor', 1.4854, 103.7618, 98, 'kasus_hukum'),
  ('Bantuan Advokasi KL', 'Jumlah bantuan advokasi di Kuala Lumpur', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800', 'Kuala Lumpur', 3.1390, 101.6869, 234, 'bantuan_advokasi')
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  image_url = VALUES(image_url),
  location_name = VALUES(location_name),
  latitude = VALUES(latitude),
  longitude = VALUES(longitude),
  data_value = VALUES(data_value),
  data_type = VALUES(data_type);

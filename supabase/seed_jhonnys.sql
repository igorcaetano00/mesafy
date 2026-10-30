-- Jhonny's Garage: restaurante piloto nº 1
-- Rode DEPOIS do schema.sql. Troque o e-mail do dono no final.

insert into restaurantes (slug, nome, subtitulo, descricao, cidade, uf, whatsapp, whatsapp_exibicao, cor, modo, status, plano)
values ('jhonnys-garage','Jhonny''s Garage','Lanchonete e Petiscaria',
        'Hambúrguer artesanal, porção farta e cerveja gelada. Som alto, preço justo e cara de interior.',
        'São Domingos do Norte','ES','5527997679086','27 99767-9086','#3dff8a','mesa','ativo','piloto')
on conflict (slug) do nothing;

do $$
declare r uuid; c uuid;
begin
  select id into r from restaurantes where slug='jhonnys-garage';

  insert into categorias (restaurante_id,nome,subtitulo,ordem) values (r,'Lanches Artesanais','Todos no pão brioche, com blend bovino feito na casa.',1) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,descricao,destaque,ordem) values
  (r,c,'Olívia Palito',28,'Blend bovino, mussarela e salada. Acompanha batata frita.',null,1),
  (r,c,'Gugu',34,'Blend bovino, bacon, cheddar, pickles e molho especial.',null,2),
  (r,c,'Vovô Popeye',34,'Blend bovino, bacon, cream cheese e salada.',null,3),
  (r,c,'Eugênio',34,'Blend bovino, mussarela, peito de peru, catupiry e salada.',null,4),
  (r,c,'Smash Duplo',36,'Duplo blend bovino, duplo cheddar e bacon.',null,5),
  (r,c,'Brutus',39,'Blend bovino, bacon, cheddar, ovo, banana e salada.',null,6),
  (r,c,'Alice',40,'Blend bovino, mussarela, barbecue, lombinho, cebola caramelizada e salada.',null,7),
  (r,c,'Dureza',42,'Blend bovino, bacon, creme de provolone, cebola roxa e salada.',null,8),
  (r,c,'Kiss Burguer',45,'Blend bovino, empanado de cheddar ou catupiry, bacon, anéis de cebola e barbecue.',null,9),
  (r,c,'Popeye',46,'Duplo blend bovino, duplo bacon, duplo cheddar, pickles, molho de picles e salada.',null,10),
  (r,c,'Smash Triplo',47,'Triplo blend bovino, triplo cheddar e bacon.',null,11),
  (r,c,'Ozzy',50,'Duplo blend bovino, bacon, banana, queijo coalho e mel. O cabeça do cardápio.','Da casa',12),
  (r,c,'Bruxa do Mar',50,'Duplo blend bovino, bacon, cheddar, mussarela, provolone, queijo prato e salada.','Da casa',13);

  insert into categorias (restaurante_id,nome,subtitulo,ordem) values (r,'Adicionais do Lanche','Monte do seu jeito.',2) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,ordem) values
  (r,c,'Blend bovino',10,1),(r,c,'Bacon',8,2),(r,c,'Creme de provolone',6,3),(r,c,'Batata frita',5,4),(r,c,'Mussarela',5,5),(r,c,'Cheddar',5,6),(r,c,'Catupiry',5,7),(r,c,'Cream cheese',5,8),(r,c,'Lombinho',5,9),(r,c,'Peito de peru',4,10),(r,c,'Maionese',3,11),(r,c,'Banana',3,12),(r,c,'Ovo',3,13),(r,c,'Cebola caramelizada',3,14),(r,c,'Barbecue',3,15),(r,c,'Salada (alface e tomate)',3,16),(r,c,'Empanado de cheddar ou catupiry',18,17);

  insert into categorias (restaurante_id,nome,subtitulo,ordem) values (r,'Petiscos e Batatas','Pra dividir na mesa enquanto a cerveja chega.',3) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,descricao,ordem) values
  (r,c,'Bolinho de Costela com Queijo',55,'8 unidades.',1),(r,c,'Bolinho de Carne de Sol com Catupiry',55,'8 unidades.',2),(r,c,'Kibe',50,'10 unidades.',3),(r,c,'Bolinho de Bacalhau',90,'6 unidades.',4),(r,c,'Coxinha de Frango com Catupiry',45,'8 unidades.',5),(r,c,'Bolinho de Tilápia',50,'8 unidades.',6),(r,c,'Porção de Batata',25,'Batata frita clássica.',7),(r,c,'Batata Rústica',30,'Com casca, temperada.',8),(r,c,'Batata com Cheddar e Bacon',45,'Batata frita coberta de cheddar e bacon.',9),(r,c,'Batata com Carne de Sol e Catupiry',55,'Batata frita, carne de sol desfiada e catupiry.',10);

  insert into categorias (restaurante_id,nome,subtitulo,ordem) values (r,'Porções de Carne','Escolha o acompanhamento: batata ou aipim.',4) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,descricao,destaque,ordem) values
  (r,c,'Porção de Alcatra',75,'Com batata ou aipim. Acompanha farofa, molho e maionese.',null,1),(r,c,'Porção de Carne de Sol',75,'Com batata ou aipim. Acompanha farofa, molho e maionese.',null,2),(r,c,'Bife de Carne de Sol',120,'Com batata ou aipim. Acompanha banana, queijo, vinagrete, farofa, molho e maionese.',null,3),(r,c,'Bife de Alcatra',120,'Com batata ou aipim. Acompanha banana, queijo, vinagrete, farofa, molho e maionese.',null,4),(r,c,'Bife de Picanha',160,'Com batata ou aipim. Acompanha banana, queijo, vinagrete, farofa, molho e maionese.','Da casa',5);

  insert into categorias (restaurante_id,nome,ordem) values (r,'Adicionais de Porção',5) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,ordem) values
  (r,c,'Farofinha',5,1),(r,c,'Banana frita',5,2),(r,c,'Maionese',4,3),(r,c,'Molho rosé',4,4),(r,c,'Molho de pimenta',4,5),(r,c,'Vinagrete',6,6),(r,c,'Queijo em cubos',7,7),(r,c,'Bacon',10,8),(r,c,'Cheddar ou catupiry',10,9),(r,c,'Cheddar ou catupiry com bacon',20,10);

  insert into categorias (restaurante_id,nome,subtitulo,ordem) values (r,'Porções de Frango','Crocante por fora, suculento por dentro.',6) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,descricao,ordem) values
  (r,c,'Franguinho Crocante',45,'Com molho rosé.',1),(r,c,'Franguinho Crocante Completo',70,'Com batata, maionese e molho rosé.',2);

  insert into categorias (restaurante_id,nome,subtitulo,ordem) values (r,'Peixe e Camarão','Fritura na hora, com limão e molho rosé.',7) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,descricao,ordem) values
  (r,c,'Filé de Tilápia',50,'Com molho rosé.',1),(r,c,'Filé de Tilápia Completo',75,'Com batata, maionese e molho rosé.',2),(r,c,'Piaba Empanada Frita',57,'Porção de piabas empanadas e fritas.',3),(r,c,'Camarão na Chapa',53,'Com molho rosé.',4),(r,c,'Camarão Encorpado',80,'10 unidades, com molho rosé.',5);

  insert into categorias (restaurante_id,nome,ordem) values (r,'Frios e Salada',8) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,descricao,ordem) values
  (r,c,'Porção de Frios',60,'Salaminho, queijo, azeitona, ovo de codorna e palmito.',1),(r,c,'Salada da Casa',53,'Alface, tomate cereja, palmito, bacon crocante, queijo gorgonzola, castanha do Pará e molho especial.',2);

  insert into categorias (restaurante_id,nome,subtitulo,ordem) values (r,'Drinks','Preparados no balcão, um por vez.',9) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,descricao,ordem) values
  (r,c,'Caipirinha',20,'Limão, cachaça e açúcar.',1),(r,c,'Caipivodka',25,'Limão, vodka e açúcar.',2),(r,c,'Lagoa Azul',25,'Vodka, limão, açúcar e curaçau blue.',3),(r,c,'Paradise',30,'Grenadine, suco de laranja, bacardi e curaçau blue.',4),(r,c,'Sex on the Beach',30,'Vodka, licor de pêssego, suco de laranja e grenadine.',5),(r,c,'Gin Tônica Mista',30,'Gin, laranja, morango e citrus.',6),(r,c,'Aperol',35,'Espumante, aperol, suco de laranja e citrus.',7),(r,c,'Gin Paraíso',35,'Gin, frutas vermelhas, limão e citrus.',8),
  (r,c,'Dose de Vodka',13,null,9),(r,c,'Dose de Gin',15,null,10),(r,c,'Dose de Campari',15,null,11),(r,c,'Beats Senses',12,null,12),(r,c,'Beats Caipirinha',12,null,13),(r,c,'Beats Gin Tônica',12,null,14),(r,c,'Red Bull tradicional',15,null,15),(r,c,'Red Bull sabores',15,null,16);

  insert into categorias (restaurante_id,nome,subtitulo,ordem) values (r,'Cervejas','Sempre trincando.',10) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,descricao,ordem) values
  (r,c,'Brahma 600ml',11,null,1),(r,c,'Original 600ml',13,null,2),(r,c,'Stella Artois 600ml',14,null,3),(r,c,'Heineken 600ml',16,null,4),(r,c,'Heineken long neck',12,'Também Heineken Zero.',5),(r,c,'Stella Artois long neck',12,null,6),(r,c,'Corona long neck',12,'Também Corona Zero.',7),(r,c,'Brahma latão',10,null,8);

  insert into categorias (restaurante_id,nome,subtitulo,ordem) values (r,'Sucos, Água e Refri','Sucos feitos na hora.',11) returning id into c;
  insert into itens (restaurante_id,categoria_id,nome,preco,descricao,ordem) values
  (r,c,'Suco de Abacaxi',12,null,1),(r,c,'Suco de Abacaxi com hortelã',12,null,2),(r,c,'Suco de Acerola',12,null,3),(r,c,'Suco de Graviola',12,null,4),(r,c,'Suco de Goiaba',12,null,5),(r,c,'Suco de Manga',12,null,6),(r,c,'Suco de Maracujá',12,null,7),(r,c,'Suco de Morango',12,null,8),(r,c,'Suco de Laranja natural',14,null,9),(r,c,'Suco de Frutas vermelhas',15,null,10),(r,c,'Limonada suíça',15,null,11),
  (r,c,'Água',5,null,12),(r,c,'Água com gás',6,null,13),(r,c,'Água tônica',7,null,14),(r,c,'H2O',8,'Limão, citrus ou limoneto.',15),(r,c,'Refri KS',6,'Coca ou Coca Zero.',16),(r,c,'Refri lata',7,'Coca, Guaraná, Sprite, Fanta uva ou Fanta laranja.',17),(r,c,'Refri 600ml',12,'Coca ou Guaraná.',18),(r,c,'Coca 1L',12,null,19),(r,c,'Coca 1,5L',14,null,20),(r,c,'Refri 2L',15,'Guaraná, Laranja ou Sprite.',21),(r,c,'Coca 2L',17,null,22);
end $$;

-- Vincular o dono (depois que ele criar a conta em /login):
-- update restaurantes set owner_id = (select id from auth.users where email='EMAIL_DO_JHONNY') where slug='jhonnys-garage';

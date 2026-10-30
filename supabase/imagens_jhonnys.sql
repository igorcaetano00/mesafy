-- Vincula as imagens do Jhonny's hospedadas no Storage do Supabase.
-- Antes: Storage > bucket "fotos" > pasta "jhonnys-garage" > subir hero.jpg, burger.jpg, petiscos.jpg,
--        carnes.jpg, frango.jpg, peixe.jpg, drinks.jpg, cervejas.jpg, sucos.jpg
-- Padrão da plataforma: fotos/{pasta do restaurante}/{arquivo}. O painel usa o ID do restaurante como pasta.
do $$
declare base text := 'https://xdmfgvvsawlfyqldbvjx.supabase.co/storage/v1/object/public/fotos/jhonnys-garage/';
        rid uuid := (select id from restaurantes where slug='jhonnys-garage');
begin
  update restaurantes set capa_url = base||'hero.jpg' where id = rid;
  update categorias c set imagem_url = base||v.f from (values
   ('Lanches Artesanais','burger.jpg'),('Petiscos e Batatas','petiscos.jpg'),('Porções de Carne','carnes.jpg'),
   ('Porções de Frango','frango.jpg'),('Peixe e Camarão','peixe.jpg'),('Drinks','drinks.jpg'),
   ('Cervejas','cervejas.jpg'),('Sucos, Água e Refri','sucos.jpg')
  ) as v(nome,f) where c.nome=v.nome and c.restaurante_id=rid;
end $$;

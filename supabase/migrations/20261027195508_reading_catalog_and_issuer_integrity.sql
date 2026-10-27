begin;
alter table public.sanads add constraint sanads_id_issuer_unique unique(id,issuer_id);
alter table public.certificates add constraint certificate_sanad_issuer_fk foreign key(sanad_id,issuer_id) references public.sanads(id,issuer_id);
insert into public.qiraat(id,display_name) values
 ('nafi','نافع'),('ibnkathir','ابن كثير'),('abiamr','أبو عمرو'),('ibnamir','ابن عامر'),('asim','عاصم'),
 ('hamza','حمزة'),('kisai','الكسائي'),('abujafar','أبو جعفر'),('yaqub','يعقوب'),('khalaf','خلف العاشر');
insert into public.riwayat(code,qiraah_id,display_name) values
 ('01','nafi','قالون'),('02','nafi','ورش'),('03','ibnkathir','البزّي'),('04','ibnkathir','قنبل'),
 ('05','abiamr','الدوري'),('06','abiamr','السوسي'),('07','ibnamir','هشام'),('08','ibnamir','ابن ذكوان'),
 ('09','asim','شعبة'),('10','asim','حفص'),('11','hamza','خلف'),('12','hamza','خلّاد'),
 ('13','kisai','أبو الحارث'),('14','kisai','الدوري'),('15','abujafar','ابن وردان'),('16','abujafar','ابن جمّاز'),
 ('17','yaqub','رويس'),('18','yaqub','روح'),('19','khalaf','إسحاق'),('20','khalaf','إدريس');
commit;

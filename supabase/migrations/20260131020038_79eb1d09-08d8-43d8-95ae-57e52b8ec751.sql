
-- Atualização de valores das unidades - Reserva do Lago
-- Total: 406 unidades

-- Quadras 1-5
UPDATE unidades u
SET valor = CASE 
  WHEN b.nome = '01' AND u.numero = '01' THEN 1114947.06
  WHEN b.nome = '01' AND u.numero = '02' THEN 700376.4716
  WHEN b.nome = '01' AND u.numero = '03' THEN 550458.8244
  WHEN b.nome = '02' AND u.numero = '01' THEN 494426.4713
  WHEN b.nome = '02' AND u.numero = '02' THEN 465705.8831
  WHEN b.nome = '02' AND u.numero = '03' THEN 465705.8831
  WHEN b.nome = '02' AND u.numero = '04' THEN 464858.8242
  WHEN b.nome = '02' AND u.numero = '05' THEN 465705.8831
  WHEN b.nome = '02' AND u.numero = '06' THEN 465411.7654
  WHEN b.nome = '02' AND u.numero = '07' THEN 518164.7067
  WHEN b.nome = '02' AND u.numero = '08' THEN 433217.6477
  WHEN b.nome = '02' AND u.numero = '09' THEN 406352.9418
  WHEN b.nome = '02' AND u.numero = '10' THEN 406600.0006
  WHEN b.nome = '02' AND u.numero = '11' THEN 406058.8241
  WHEN b.nome = '02' AND u.numero = '12' THEN 400047.0594
  WHEN b.nome = '02' AND u.numero = '13' THEN 406647.0594
  WHEN b.nome = '02' AND u.numero = '14' THEN 406176.4712
  WHEN b.nome = '02' AND u.numero = '15' THEN 406352.9418
  WHEN b.nome = '02' AND u.numero = '16' THEN 453976.4713
  WHEN b.nome = '03' AND u.numero = '01' THEN 547890.5891
  WHEN b.nome = '03' AND u.numero = '02' THEN 494411.7654
  WHEN b.nome = '03' AND u.numero = '03' THEN 494882.3537
  WHEN b.nome = '03' AND u.numero = '04' THEN 494470.589
  WHEN b.nome = '03' AND u.numero = '05' THEN 533720.0008
  WHEN b.nome = '03' AND u.numero = '06' THEN 465176.4713
  WHEN b.nome = '03' AND u.numero = '07' THEN 465294.1183
  WHEN b.nome = '03' AND u.numero = '08' THEN 465352.9419
  WHEN b.nome = '03' AND u.numero = '09' THEN 465235.2948
  WHEN b.nome = '03' AND u.numero = '10' THEN 471647.0595
  WHEN b.nome = '03' AND u.numero = '11' THEN 519070.589
  WHEN b.nome = '04' AND u.numero = '01' THEN 494673.5302
  WHEN b.nome = '04' AND u.numero = '02' THEN 414479.4124
  WHEN b.nome = '04' AND u.numero = '03' THEN 391746.4712
  WHEN b.nome = '04' AND u.numero = '04' THEN 380950.0006
  WHEN b.nome = '04' AND u.numero = '05' THEN 380335.2947
  WHEN b.nome = '04' AND u.numero = '06' THEN 381061.7653
  WHEN b.nome = '04' AND u.numero = '07' THEN 380894.1182
  WHEN b.nome = '04' AND u.numero = '08' THEN 380111.7653
  WHEN b.nome = '04' AND u.numero = '09' THEN 380894.1182
  WHEN b.nome = '04' AND u.numero = '10' THEN 413641.1771
  WHEN b.nome = '04' AND u.numero = '11' THEN 524674.1184
  WHEN b.nome = '04' AND u.numero = '12' THEN 620401.7656
  WHEN b.nome = '04' AND u.numero = '13' THEN 458850.0007
  WHEN b.nome = '04' AND u.numero = '14' THEN 408824.1183
  WHEN b.nome = '04' AND u.numero = '15' THEN 363682.3535
  WHEN b.nome = '04' AND u.numero = '16' THEN 363626.4711
  WHEN b.nome = '04' AND u.numero = '17' THEN 363291.177
  WHEN b.nome = '04' AND u.numero = '18' THEN 364241.177
  WHEN b.nome = '04' AND u.numero = '19' THEN 363850.0005
  WHEN b.nome = '04' AND u.numero = '20' THEN 366577.0594
  WHEN b.nome = '04' AND u.numero = '21' THEN 366890.0006
  WHEN b.nome = '04' AND u.numero = '22' THEN 363838.8241
  WHEN b.nome = '04' AND u.numero = '23' THEN 561569.4126
  WHEN b.nome = '05' AND u.numero = '01' THEN 505482.3537
  WHEN b.nome = '05' AND u.numero = '02' THEN 436720.59
  WHEN b.nome = '05' AND u.numero = '03' THEN 436272.9418
  WHEN b.nome = '05' AND u.numero = '04' THEN 425320.5889
  WHEN b.nome = '05' AND u.numero = '05' THEN 426941.1771
  WHEN b.nome = '05' AND u.numero = '06' THEN 436720.5889
  WHEN b.nome = '05' AND u.numero = '07' THEN 436161.7654
  WHEN b.nome = '05' AND u.numero = '08' THEN 482752.9419
  WHEN b.nome = '05' AND u.numero = '09' THEN 441915.2948
  WHEN b.nome = '05' AND u.numero = '10' THEN 375473.53
  WHEN b.nome = '05' AND u.numero = '11' THEN 375305.8829
  WHEN b.nome = '05' AND u.numero = '12' THEN 375082.3535
  WHEN b.nome = '05' AND u.numero = '13' THEN 374802.9417
  WHEN b.nome = '05' AND u.numero = '14' THEN 375082.3535
  WHEN b.nome = '05' AND u.numero = '15' THEN 374858.8241
  WHEN b.nome = '05' AND u.numero = '16' THEN 374802.9417
  WHEN b.nome = '05' AND u.numero = '17' THEN 374937.0594
  WHEN b.nome = '05' AND u.numero = '18' THEN 420061.7653
  ELSE u.valor
END,
updated_at = NOW()
FROM blocos b
WHERE u.bloco_id = b.id
  AND u.empreendimento_id = '13fc62b0-c926-48de-8a53-2c63efcdfdc0'
  AND b.nome IN ('01', '02', '03', '04', '05');

-- Quadras 6-10
UPDATE unidades u
SET valor = CASE 
  WHEN b.nome = '06' AND u.numero = '01' THEN 657262.9422
  WHEN b.nome = '06' AND u.numero = '02' THEN 655323.5304
  WHEN b.nome = '06' AND u.numero = '03' THEN 655261.7657
  WHEN b.nome = '06' AND u.numero = '04' THEN 655200.001
  WHEN b.nome = '07' AND u.numero = '01' THEN 433464.7065
  WHEN b.nome = '07' AND u.numero = '02' THEN 365664.7064
  WHEN b.nome = '07' AND u.numero = '03' THEN 366194.1182
  WHEN b.nome = '07' AND u.numero = '04' THEN 333635.2946
  WHEN b.nome = '07' AND u.numero = '05' THEN 365876.4711
  WHEN b.nome = '07' AND u.numero = '06' THEN 360529.4123
  WHEN b.nome = '07' AND u.numero = '07' THEN 360614.1182
  WHEN b.nome = '07' AND u.numero = '08' THEN 365452.9417
  WHEN b.nome = '07' AND u.numero = '09' THEN 365770.5888
  WHEN b.nome = '07' AND u.numero = '10' THEN 365770.5888
  WHEN b.nome = '07' AND u.numero = '11' THEN 365717.6476
  WHEN b.nome = '07' AND u.numero = '12' THEN 453782.3536
  WHEN b.nome = '07' AND u.numero = '13' THEN 402187.0594
  WHEN b.nome = '07' AND u.numero = '14' THEN 317678.824
  WHEN b.nome = '07' AND u.numero = '15' THEN 318547.0593
  WHEN b.nome = '07' AND u.numero = '16' THEN 318070.5887
  WHEN b.nome = '07' AND u.numero = '17' THEN 318176.4711
  WHEN b.nome = '07' AND u.numero = '18' THEN 318504.7064
  WHEN b.nome = '07' AND u.numero = '19' THEN 318494.1181
  WHEN b.nome = '07' AND u.numero = '20' THEN 323629.4123
  WHEN b.nome = '07' AND u.numero = '21' THEN 318494.1181
  WHEN b.nome = '07' AND u.numero = '22' THEN 318250.5887
  WHEN b.nome = '07' AND u.numero = '23' THEN 318123.5299
  WHEN b.nome = '07' AND u.numero = '24' THEN 318271.7652
  WHEN b.nome = '07' AND u.numero = '25' THEN 317742.3534
  WHEN b.nome = '07' AND u.numero = '26' THEN 439534.1183
  WHEN b.nome = '08' AND u.numero = '01' THEN 453407.0595
  WHEN b.nome = '08' AND u.numero = '02' THEN 370672.9417
  WHEN b.nome = '08' AND u.numero = '03' THEN 370990.5888
  WHEN b.nome = '08' AND u.numero = '04' THEN 371064.7064
  WHEN b.nome = '08' AND u.numero = '05' THEN 370704.7064
  WHEN b.nome = '08' AND u.numero = '06' THEN 371032.9417
  WHEN b.nome = '08' AND u.numero = '07' THEN 370715.2947
  WHEN b.nome = '08' AND u.numero = '08' THEN 371276.4711
  WHEN b.nome = '08' AND u.numero = '09' THEN 370852.9417
  WHEN b.nome = '08' AND u.numero = '10' THEN 370651.7653
  WHEN b.nome = '08' AND u.numero = '11' THEN 442099.4124
  WHEN b.nome = '08' AND u.numero = '12' THEN 527818.8243
  WHEN b.nome = '08' AND u.numero = '13' THEN 360529.4123
  WHEN b.nome = '08' AND u.numero = '14' THEN 360317.6476
  WHEN b.nome = '08' AND u.numero = '15' THEN 360635.2947
  WHEN b.nome = '08' AND u.numero = '16' THEN 360635.2947
  WHEN b.nome = '08' AND u.numero = '17' THEN 360741.177
  WHEN b.nome = '08' AND u.numero = '18' THEN 360688.2358
  WHEN b.nome = '08' AND u.numero = '19' THEN 360847.0594
  WHEN b.nome = '08' AND u.numero = '20' THEN 360476.4711
  WHEN b.nome = '08' AND u.numero = '21' THEN 360476.4711
  WHEN b.nome = '08' AND u.numero = '22' THEN 360264.7064
  WHEN b.nome = '08' AND u.numero = '23' THEN 433316.4712
  WHEN b.nome = '09' AND u.numero = '01' THEN 556561.7655
  WHEN b.nome = '09' AND u.numero = '02' THEN 562145.295
  WHEN b.nome = '10' AND u.numero = '01' THEN 557092.942
  WHEN b.nome = '10' AND u.numero = '02' THEN 400400.0006
  WHEN b.nome = '10' AND u.numero = '03' THEN 400220.0006
  WHEN b.nome = '10' AND u.numero = '04' THEN 350500.0005
  WHEN b.nome = '10' AND u.numero = '05' THEN 350550.0005
  WHEN b.nome = '10' AND u.numero = '06' THEN 330550.0005
  WHEN b.nome = '10' AND u.numero = '07' THEN 330800.0005
  WHEN b.nome = '10' AND u.numero = '08' THEN 330350.0005
  WHEN b.nome = '10' AND u.numero = '09' THEN 330150.0005
  WHEN b.nome = '10' AND u.numero = '10' THEN 350850.0005
  WHEN b.nome = '10' AND u.numero = '11' THEN 350050.0005
  WHEN b.nome = '10' AND u.numero = '12' THEN 350750.0005
  WHEN b.nome = '10' AND u.numero = '13' THEN 619584.7068
  WHEN b.nome = '10' AND u.numero = '14' THEN 582564.7068
  WHEN b.nome = '10' AND u.numero = '15' THEN 405930.0006
  WHEN b.nome = '10' AND u.numero = '16' THEN 335400.0005
  WHEN b.nome = '10' AND u.numero = '17' THEN 320760.0005
  WHEN b.nome = '10' AND u.numero = '18' THEN 325500.0005
  WHEN b.nome = '10' AND u.numero = '19' THEN 320600.0005
  WHEN b.nome = '10' AND u.numero = '20' THEN 320950.0005
  WHEN b.nome = '10' AND u.numero = '21' THEN 320660.0005
  WHEN b.nome = '10' AND u.numero = '22' THEN 320250.0005
  WHEN b.nome = '10' AND u.numero = '23' THEN 320150.0005
  WHEN b.nome = '10' AND u.numero = '24' THEN 320630.0005
  WHEN b.nome = '10' AND u.numero = '25' THEN 330180.0005
  WHEN b.nome = '10' AND u.numero = '26' THEN 350690.0005
  WHEN b.nome = '10' AND u.numero = '27' THEN 620490.5892
  ELSE u.valor
END,
updated_at = NOW()
FROM blocos b
WHERE u.bloco_id = b.id
  AND u.empreendimento_id = '13fc62b0-c926-48de-8a53-2c63efcdfdc0'
  AND b.nome IN ('06', '07', '08', '09', '10');

-- Quadras 11-15
UPDATE unidades u
SET valor = CASE 
  WHEN b.nome = '11' AND u.numero = '01' THEN 507009.4125
  WHEN b.nome = '11' AND u.numero = '02' THEN 335700.0005
  WHEN b.nome = '11' AND u.numero = '03' THEN 335250.0005
  WHEN b.nome = '11' AND u.numero = '04' THEN 335350.0005
  WHEN b.nome = '11' AND u.numero = '05' THEN 335150.0005
  WHEN b.nome = '11' AND u.numero = '06' THEN 335200.0005
  WHEN b.nome = '11' AND u.numero = '07' THEN 335350.0005
  WHEN b.nome = '11' AND u.numero = '08' THEN 335500.0005
  WHEN b.nome = '11' AND u.numero = '09' THEN 335150.0005
  WHEN b.nome = '11' AND u.numero = '10' THEN 335300.0005
  WHEN b.nome = '11' AND u.numero = '11' THEN 335750.0005
  WHEN b.nome = '11' AND u.numero = '12' THEN 335850.0005
  WHEN b.nome = '11' AND u.numero = '13' THEN 433155.883
  WHEN b.nome = '11' AND u.numero = '14' THEN 518294.1184
  WHEN b.nome = '11' AND u.numero = '15' THEN 330500.0005
  WHEN b.nome = '11' AND u.numero = '16' THEN 330550.0005
  WHEN b.nome = '11' AND u.numero = '17' THEN 330800.0005
  WHEN b.nome = '11' AND u.numero = '18' THEN 320800.0005
  WHEN b.nome = '11' AND u.numero = '19' THEN 320700.0005
  WHEN b.nome = '11' AND u.numero = '20' THEN 320500.0005
  WHEN b.nome = '11' AND u.numero = '21' THEN 330800.0005
  WHEN b.nome = '11' AND u.numero = '22' THEN 330450.0005
  WHEN b.nome = '11' AND u.numero = '23' THEN 330600.0005
  WHEN b.nome = '11' AND u.numero = '24' THEN 330600.0005
  WHEN b.nome = '11' AND u.numero = '25' THEN 330000.0005
  WHEN b.nome = '11' AND u.numero = '26' THEN 439369.4124
  WHEN b.nome = '12' AND u.numero = '01' THEN 438628.236
  WHEN b.nome = '12' AND u.numero = '02' THEN 323047.0593
  WHEN b.nome = '12' AND u.numero = '03' THEN 324211.7652
  WHEN b.nome = '12' AND u.numero = '04' THEN 334916.4711
  WHEN b.nome = '12' AND u.numero = '05' THEN 326255.2946
  WHEN b.nome = '12' AND u.numero = '06' THEN 324825.8828
  WHEN b.nome = '12' AND u.numero = '07' THEN 323205.8828
  WHEN b.nome = '12' AND u.numero = '08' THEN 323682.3534
  WHEN b.nome = '12' AND u.numero = '09' THEN 317805.8828
  WHEN b.nome = '12' AND u.numero = '10' THEN 318494.1181
  WHEN b.nome = '12' AND u.numero = '11' THEN 322792.9417
  WHEN b.nome = '12' AND u.numero = '12' THEN 320294.1181
  WHEN b.nome = '12' AND u.numero = '13' THEN 328764.7064
  WHEN b.nome = '12' AND u.numero = '14' THEN 431937.6477
  WHEN b.nome = '12' AND u.numero = '15' THEN 520478.8243
  WHEN b.nome = '12' AND u.numero = '16' THEN 360307.0594
  WHEN b.nome = '12' AND u.numero = '17' THEN 360952.9417
  WHEN b.nome = '12' AND u.numero = '18' THEN 360349.4123
  WHEN b.nome = '12' AND u.numero = '19' THEN 360307.0594
  WHEN b.nome = '12' AND u.numero = '20' THEN 360243.53
  WHEN b.nome = '12' AND u.numero = '21' THEN 360910.5888
  WHEN b.nome = '12' AND u.numero = '22' THEN 360751.7652
  WHEN b.nome = '12' AND u.numero = '23' THEN 360423.53
  WHEN b.nome = '12' AND u.numero = '24' THEN 391881.1771
  WHEN b.nome = '12' AND u.numero = '25' THEN 392145.8829
  WHEN b.nome = '12' AND u.numero = '26' THEN 402808.2359
  WHEN b.nome = '12' AND u.numero = '27' THEN 510568.2361
  WHEN b.nome = '13' AND u.numero = '01' THEN 517271.7655
  WHEN b.nome = '13' AND u.numero = '02' THEN 360847.0594
  WHEN b.nome = '13' AND u.numero = '03' THEN 360635.2947
  WHEN b.nome = '13' AND u.numero = '04' THEN 360423.53
  WHEN b.nome = '13' AND u.numero = '05' THEN 360741.177
  WHEN b.nome = '13' AND u.numero = '06' THEN 360476.4711
  WHEN b.nome = '13' AND u.numero = '07' THEN 360105.8829
  WHEN b.nome = '13' AND u.numero = '08' THEN 360582.3535
  WHEN b.nome = '13' AND u.numero = '09' THEN 360264.7064
  WHEN b.nome = '13' AND u.numero = '10' THEN 360264.7064
  WHEN b.nome = '13' AND u.numero = '11' THEN 360158.8241
  WHEN b.nome = '13' AND u.numero = '12' THEN 361058.8241
  WHEN b.nome = '13' AND u.numero = '13' THEN 360370.5888
  WHEN b.nome = '13' AND u.numero = '14' THEN 438961.7654
  WHEN b.nome = '13' AND u.numero = '15' THEN 494236.4713
  WHEN b.nome = '13' AND u.numero = '16' THEN 338982.3534
  WHEN b.nome = '13' AND u.numero = '17' THEN 339088.2358
  WHEN b.nome = '13' AND u.numero = '18' THEN 338897.6476
  WHEN b.nome = '13' AND u.numero = '19' THEN 339755.2946
  WHEN b.nome = '13' AND u.numero = '20' THEN 339352.9417
  WHEN b.nome = '13' AND u.numero = '21' THEN 339194.1182
  WHEN b.nome = '13' AND u.numero = '22' THEN 339405.8829
  WHEN b.nome = '13' AND u.numero = '23' THEN 339247.0593
  WHEN b.nome = '13' AND u.numero = '24' THEN 339352.9417
  WHEN b.nome = '13' AND u.numero = '25' THEN 338876.4711
  WHEN b.nome = '13' AND u.numero = '26' THEN 338982.3534
  WHEN b.nome = '13' AND u.numero = '27' THEN 339458.824
  WHEN b.nome = '13' AND u.numero = '28' THEN 349951.7652
  WHEN b.nome = '13' AND u.numero = '29' THEN 420679.4124
  WHEN b.nome = '14' AND u.numero = '01' THEN 494216.4713
  WHEN b.nome = '14' AND u.numero = '02' THEN 358205.8829
  WHEN b.nome = '14' AND u.numero = '03' THEN 357702.9417
  WHEN b.nome = '14' AND u.numero = '04' THEN 358094.1182
  WHEN b.nome = '14' AND u.numero = '05' THEN 366252.9417
  WHEN b.nome = '14' AND u.numero = '06' THEN 362352.3535
  WHEN b.nome = '14' AND u.numero = '07' THEN 357859.4123
  WHEN b.nome = '14' AND u.numero = '08' THEN 358038.2358
  WHEN b.nome = '14' AND u.numero = '09' THEN 358127.6476
  WHEN b.nome = '14' AND u.numero = '10' THEN 357647.0594
  WHEN b.nome = '14' AND u.numero = '11' THEN 358261.7652
  WHEN b.nome = '14' AND u.numero = '12' THEN 358518.8241
  WHEN b.nome = '14' AND u.numero = '13' THEN 518565.8831
  WHEN b.nome = '14' AND u.numero = '14' THEN 494117.6478
  WHEN b.nome = '14' AND u.numero = '15' THEN 352729.4123
  WHEN b.nome = '14' AND u.numero = '16' THEN 352461.177
  WHEN b.nome = '14' AND u.numero = '17' THEN 352561.7652
  WHEN b.nome = '14' AND u.numero = '18' THEN 352170.5888
  WHEN b.nome = '14' AND u.numero = '19' THEN 352673.5299
  WHEN b.nome = '14' AND u.numero = '20' THEN 352394.1182
  WHEN b.nome = '14' AND u.numero = '21' THEN 352729.4123
  WHEN b.nome = '14' AND u.numero = '22' THEN 352226.4711
  WHEN b.nome = '14' AND u.numero = '23' THEN 358597.0594
  WHEN b.nome = '14' AND u.numero = '24' THEN 357814.7064
  WHEN b.nome = '14' AND u.numero = '25' THEN 386538.2359
  WHEN b.nome = '14' AND u.numero = '26' THEN 613748.2362
  WHEN b.nome = '15' AND u.numero = '01' THEN 502945.8831
  WHEN b.nome = '15' AND u.numero = '02' THEN 352841.177
  WHEN b.nome = '15' AND u.numero = '03' THEN 352785.2946
  WHEN b.nome = '15' AND u.numero = '04' THEN 352170.5888
  WHEN b.nome = '15' AND u.numero = '05' THEN 352617.6476
  WHEN b.nome = '15' AND u.numero = '06' THEN 352505.8829
  WHEN b.nome = '15' AND u.numero = '07' THEN 352170.5888
  WHEN b.nome = '15' AND u.numero = '08' THEN 352729.4123
  WHEN b.nome = '15' AND u.numero = '09' THEN 352282.3535
  WHEN b.nome = '15' AND u.numero = '10' THEN 352617.6476
  WHEN b.nome = '15' AND u.numero = '11' THEN 352673.5299
  WHEN b.nome = '15' AND u.numero = '12' THEN 352505.8829
  WHEN b.nome = '15' AND u.numero = '13' THEN 352729.4123
  WHEN b.nome = '15' AND u.numero = '14' THEN 352729.4123
  WHEN b.nome = '15' AND u.numero = '15' THEN 433341.1771
  WHEN b.nome = '15' AND u.numero = '16' THEN 518100.0008
  WHEN b.nome = '15' AND u.numero = '17' THEN 357926.4711
  WHEN b.nome = '15' AND u.numero = '18' THEN 357870.5888
  WHEN b.nome = '15' AND u.numero = '19' THEN 357926.4711
  WHEN b.nome = '15' AND u.numero = '20' THEN 358261.7652
  WHEN b.nome = '15' AND u.numero = '21' THEN 358317.6476
  WHEN b.nome = '15' AND u.numero = '22' THEN 358205.8829
  WHEN b.nome = '15' AND u.numero = '23' THEN 358317.6476
  WHEN b.nome = '15' AND u.numero = '24' THEN 358205.8829
  WHEN b.nome = '15' AND u.numero = '25' THEN 357702.9417
  WHEN b.nome = '15' AND u.numero = '26' THEN 358429.4123
  WHEN b.nome = '15' AND u.numero = '27' THEN 358541.177
  WHEN b.nome = '15' AND u.numero = '28' THEN 358150.0005
  WHEN b.nome = '15' AND u.numero = '29' THEN 358317.6476
  WHEN b.nome = '15' AND u.numero = '30' THEN 420555.883
  ELSE u.valor
END,
updated_at = NOW()
FROM blocos b
WHERE u.bloco_id = b.id
  AND u.empreendimento_id = '13fc62b0-c926-48de-8a53-2c63efcdfdc0'
  AND b.nome IN ('11', '12', '13', '14', '15');

-- Quadras 16-20
UPDATE unidades u
SET valor = CASE 
  WHEN b.nome = '16' AND u.numero = '01' THEN 556561.7655
  WHEN b.nome = '16' AND u.numero = '02' THEN 408511.7653
  WHEN b.nome = '16' AND u.numero = '03' THEN 407647.0594
  WHEN b.nome = '16' AND u.numero = '04' THEN 408450.0006
  WHEN b.nome = '16' AND u.numero = '05' THEN 407832.3536
  WHEN b.nome = '16' AND u.numero = '06' THEN 407894.1183
  WHEN b.nome = '16' AND u.numero = '07' THEN 408264.7065
  WHEN b.nome = '16' AND u.numero = '08' THEN 408573.53
  WHEN b.nome = '16' AND u.numero = '09' THEN 407955.883
  WHEN b.nome = '16' AND u.numero = '10' THEN 408141.1771
  WHEN b.nome = '16' AND u.numero = '11' THEN 407894.1183
  WHEN b.nome = '16' AND u.numero = '12' THEN 408202.9418
  WHEN b.nome = '16' AND u.numero = '13' THEN 407647.0594
  WHEN b.nome = '16' AND u.numero = '14' THEN 560107.0597
  WHEN b.nome = '16' AND u.numero = '15' THEN 618326.4715
  WHEN b.nome = '16' AND u.numero = '16' THEN 457417.0595
  WHEN b.nome = '16' AND u.numero = '17' THEN 458084.1183
  WHEN b.nome = '16' AND u.numero = '18' THEN 457750.5889
  WHEN b.nome = '16' AND u.numero = '19' THEN 457367.6477
  WHEN b.nome = '16' AND u.numero = '20' THEN 457713.5301
  WHEN b.nome = '16' AND u.numero = '21' THEN 410055.883
  WHEN b.nome = '16' AND u.numero = '22' THEN 445706.4713
  WHEN b.nome = '16' AND u.numero = '23' THEN 457837.0595
  WHEN b.nome = '16' AND u.numero = '24' THEN 457614.7066
  WHEN b.nome = '16' AND u.numero = '25' THEN 457614.7066
  WHEN b.nome = '16' AND u.numero = '26' THEN 457762.9419
  WHEN b.nome = '16' AND u.numero = '27' THEN 648107.0598
  WHEN b.nome = '17' AND u.numero = '01' THEN 511267.0596
  WHEN b.nome = '17' AND u.numero = '02' THEN 396220.5888
  WHEN b.nome = '17' AND u.numero = '03' THEN 395850.0006
  WHEN b.nome = '17' AND u.numero = '04' THEN 395788.2359
  WHEN b.nome = '17' AND u.numero = '05' THEN 395850.0006
  WHEN b.nome = '17' AND u.numero = '06' THEN 395911.7653
  WHEN b.nome = '17' AND u.numero = '07' THEN 395973.53
  WHEN b.nome = '17' AND u.numero = '08' THEN 396035.2947
  WHEN b.nome = '17' AND u.numero = '09' THEN 395911.7653
  WHEN b.nome = '17' AND u.numero = '10' THEN 395911.7653
  WHEN b.nome = '17' AND u.numero = '11' THEN 396220.5888
  WHEN b.nome = '17' AND u.numero = '12' THEN 395850.0006
  WHEN b.nome = '17' AND u.numero = '13' THEN 395355.8829
  WHEN b.nome = '17' AND u.numero = '14' THEN 395850.0006
  WHEN b.nome = '17' AND u.numero = '15' THEN 395417.6477
  WHEN b.nome = '17' AND u.numero = '16' THEN 457738.236
  WHEN b.nome = '17' AND u.numero = '17' THEN 500202.3537
  WHEN b.nome = '17' AND u.numero = '18' THEN 396344.1182
  WHEN b.nome = '17' AND u.numero = '19' THEN 395726.4712
  WHEN b.nome = '17' AND u.numero = '20' THEN 395726.4712
  WHEN b.nome = '17' AND u.numero = '21' THEN 395541.1771
  WHEN b.nome = '17' AND u.numero = '22' THEN 395602.9418
  WHEN b.nome = '17' AND u.numero = '23' THEN 395479.4124
  WHEN b.nome = '17' AND u.numero = '24' THEN 395726.4712
  WHEN b.nome = '17' AND u.numero = '25' THEN 395788.2359
  WHEN b.nome = '17' AND u.numero = '26' THEN 395664.7065
  WHEN b.nome = '17' AND u.numero = '27' THEN 395726.4712
  WHEN b.nome = '17' AND u.numero = '28' THEN 396344.1182
  WHEN b.nome = '17' AND u.numero = '29' THEN 395911.7653
  WHEN b.nome = '17' AND u.numero = '30' THEN 396097.0594
  WHEN b.nome = '17' AND u.numero = '31' THEN 420753.53
  WHEN b.nome = '17' AND u.numero = '32' THEN 502060.589
  WHEN b.nome = '18' AND u.numero = '01' THEN 402056.4712
  WHEN b.nome = '18' AND u.numero = '02' THEN 401305.883
  WHEN b.nome = '18' AND u.numero = '03' THEN 401823.53
  WHEN b.nome = '18' AND u.numero = '04' THEN 427770.5889
  WHEN b.nome = '18' AND u.numero = '05' THEN 428029.4124
  WHEN b.nome = '18' AND u.numero = '06' THEN 433529.4124
  WHEN b.nome = '18' AND u.numero = '07' THEN 434176.4712
  WHEN b.nome = '18' AND u.numero = '08' THEN 434047.0595
  WHEN b.nome = '18' AND u.numero = '09' THEN 420976.4712
  WHEN b.nome = '18' AND u.numero = '10' THEN 421300.0006
  WHEN b.nome = '18' AND u.numero = '11' THEN 414829.4124
  WHEN b.nome = '18' AND u.numero = '12' THEN 388882.3535
  WHEN b.nome = '18' AND u.numero = '13' THEN 395417.6477
  WHEN b.nome = '18' AND u.numero = '14' THEN 430643.5301
  WHEN b.nome = '18' AND u.numero = '15' THEN 517905.8831
  WHEN b.nome = '18' AND u.numero = '16' THEN 518358.8243
  WHEN b.nome = '18' AND u.numero = '17' THEN 531235.2949
  WHEN b.nome = '18' AND u.numero = '18' THEN 518164.7067
  WHEN b.nome = '18' AND u.numero = '19' THEN 518358.8243
  WHEN b.nome = '18' AND u.numero = '20' THEN 517970.589
  WHEN b.nome = '18' AND u.numero = '21' THEN 517711.7655
  WHEN b.nome = '18' AND u.numero = '22' THEN 553520.0008
  WHEN b.nome = '19' AND u.numero = '01' THEN 453847.0595
  WHEN b.nome = '19' AND u.numero = '02' THEN 389673.53
  WHEN b.nome = '19' AND u.numero = '03' THEN 389735.2947
  WHEN b.nome = '19' AND u.numero = '04' THEN 389920.5888
  WHEN b.nome = '19' AND u.numero = '05' THEN 389302.9418
  WHEN b.nome = '19' AND u.numero = '06' THEN 389797.0594
  WHEN b.nome = '19' AND u.numero = '07' THEN 389364.7065
  WHEN b.nome = '19' AND u.numero = '08' THEN 389241.1771
  WHEN b.nome = '19' AND u.numero = '09' THEN 389488.2359
  WHEN b.nome = '19' AND u.numero = '10' THEN 390291.1771
  WHEN b.nome = '19' AND u.numero = '11' THEN 389302.9418
  WHEN b.nome = '19' AND u.numero = '12' THEN 389735.2947
  WHEN b.nome = '19' AND u.numero = '13' THEN 390167.6476
  WHEN b.nome = '19' AND u.numero = '14' THEN 389426.4712
  WHEN b.nome = '19' AND u.numero = '15' THEN 429622.9418
  WHEN b.nome = '19' AND u.numero = '16' THEN 440647.0595
  WHEN b.nome = '19' AND u.numero = '17' THEN 383435.2947
  WHEN b.nome = '19' AND u.numero = '18' THEN 383682.3535
  WHEN b.nome = '19' AND u.numero = '19' THEN 383435.2947
  WHEN b.nome = '19' AND u.numero = '20' THEN 383558.8241
  WHEN b.nome = '19' AND u.numero = '21' THEN 383620.5888
  WHEN b.nome = '19' AND u.numero = '22' THEN 383805.8829
  WHEN b.nome = '19' AND u.numero = '23' THEN 383620.5888
  WHEN b.nome = '19' AND u.numero = '24' THEN 383682.3535
  WHEN b.nome = '19' AND u.numero = '25' THEN 383126.4712
  WHEN b.nome = '19' AND u.numero = '26' THEN 383188.2359
  WHEN b.nome = '19' AND u.numero = '27' THEN 383558.8241
  WHEN b.nome = '19' AND u.numero = '28' THEN 383497.0594
  WHEN b.nome = '19' AND u.numero = '29' THEN 414885.883
  WHEN b.nome = '20' AND u.numero = '01' THEN 712217.6481
  WHEN b.nome = '20' AND u.numero = '02' THEN 716552.9423
  WHEN b.nome = '20' AND u.numero = '03' THEN 718817.6481
  WHEN b.nome = '20' AND u.numero = '04' THEN 683591.7657
  WHEN b.nome = '20' AND u.numero = '05' THEN 685752.9422
  ELSE u.valor
END,
updated_at = NOW()
FROM blocos b
WHERE u.bloco_id = b.id
  AND u.empreendimento_id = '13fc62b0-c926-48de-8a53-2c63efcdfdc0'
  AND b.nome IN ('16', '17', '18', '19', '20');

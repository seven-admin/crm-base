UPDATE atividades
SET tipo = 'atendimento', updated_at = now()
WHERE id IN (
  '47c19746-b645-4052-9f3a-15b756dc6098',
  '5e04c287-8e24-424a-a82d-f88e3ec8736f',
  '57b04342-a9a5-4c47-a8bd-293ce6fa8cab',
  '5c71efc6-1b18-4551-83d4-c11e3f849431',
  '2bdcd72a-7849-4196-af0f-e2984a12b40d',
  'bfa8e0aa-3bb5-4aa4-b032-b7362ced0503',
  '78735aa2-6470-46e1-9672-d54110aa37cb',
  '673746c5-edf9-40a8-87bf-c26f46c8393d',
  'dbb982cd-afeb-418c-954c-9708e44aaa58'
)
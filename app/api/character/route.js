import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: '캐릭터 이름을 입력해주세요.' }, { status: 400 });
  }

  try {
    const token = process.env.LOA_API_KEY;
    
    if (!token) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 401 });
    }

    const cleanToken = token.replace(/^bearer\s+/i, '').trim();
    const headers = { 
      'accept': 'application/json',
      'authorization': `bearer ${cleanToken}` 
    };

    const sibUrl = `https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(name)}/siblings`;
    const sibRes = await fetch(sibUrl, { headers });
    
    if (!sibRes.ok) {
      return NextResponse.json({ error: '캐릭터 원정대 조회 실패' }, { status: sibRes.status });
    }
    
    const siblings = await sibRes.json();

    const highLevelChars = siblings.filter(char => {
      const rawLevel = char.ItemMaxLevel || char.ItemAvgLevel || "0";
      const itemLevel = parseFloat(String(rawLevel).replace(/,/g, ''));
      return itemLevel >= 1700;
    });

    const detailedChars = await Promise.all(highLevelChars.map(async (char) => {
      const profUrl = `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(char.CharacterName)}/profiles`;
      const profRes = await fetch(profUrl, { headers });
      
      let combatPower = 0;
      let characterImage = null; // ⚡ 초상화 이미지 변수 추가
      const rawLevel = char.ItemMaxLevel || char.ItemAvgLevel || "0";
      let itemLevel = parseFloat(String(rawLevel).replace(/,/g, ''));

      if (profRes.ok) {
        const profile = await profRes.json();
        
        if (profile) {
          if (profile.CombatPower !== undefined) {
            combatPower = parseInt(String(profile.CombatPower).replace(/,/g, ''), 10);
          }
          if (profile.CharacterImage) {
            characterImage = profile.CharacterImage; // ⚡ API로부터 전신 이미지 주소 추출
          }
        }
      }

      return {
        CharacterName: char.CharacterName,
        CharacterClassName: char.CharacterClassName,
        ItemLevel: itemLevel,
        CombatPower: combatPower,
        CharacterImage: characterImage // ⚡ 결과 객체에 포함
      };
    }));

    return NextResponse.json(detailedChars);
    
  } catch (error) {
    console.error("❌ 서버 내부 에러:", error);
    return NextResponse.json({ error: '서버 통신 중 에러가 발생했습니다.' }, { status: 500 });
  }
}
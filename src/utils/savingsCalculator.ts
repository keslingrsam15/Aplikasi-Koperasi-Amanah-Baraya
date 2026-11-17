import { Member } from '../types';

export interface MemberSavingsBreakdown {
  pokok: number;
  wajib: number;
  sukarela: number;
  wisata: number;
  total: number;
}

export interface AllMembersSavingsSummary {
  totalPokok: number;
  totalWajib: number;
  totalSukarela: number;
  totalWisata: number;
  totalAllSavings: number;
  avgSavings: number;
}

export function getMemberSavingsBreakdown(
  member: Pick<Member, 'simpananPokok' | 'simpananWajib' | 'simpananSukarela' | 'simpananWisata'>
): MemberSavingsBreakdown {
  const pokok = Math.max(0, Number(member.simpananPokok || 0));
  const wajib = Math.max(0, Number(member.simpananWajib || 0));
  const sukarela = Math.max(0, Number(member.simpananSukarela || 0));
  const wisata = Math.max(0, Number(member.simpananWisata || 0));
  return {
    pokok,
    wajib,
    sukarela,
    wisata,
    total: pokok + wajib + sukarela + wisata,
  };
}

export function getMemberTotalSavings(
  member: Pick<Member, 'simpananPokok' | 'simpananWajib' | 'simpananSukarela' | 'simpananWisata'>
): number {
  return getMemberSavingsBreakdown(member).total;
}

export function getAllMembersSavingsSummary(
  members: Array<
    Pick<Member, 'simpananPokok' | 'simpananWajib' | 'simpananSukarela' | 'simpananWisata'>
  >
): AllMembersSavingsSummary {
  let totalPokok = 0;
  let totalWajib = 0;
  let totalSukarela = 0;
  let totalWisata = 0;

  for (const m of members) {
    const b = getMemberSavingsBreakdown(m);
    totalPokok += b.pokok;
    totalWajib += b.wajib;
    totalSukarela += b.sukarela;
    totalWisata += b.wisata;
  }

  const totalAllSavings = totalPokok + totalWajib + totalSukarela + totalWisata;
  const avgSavings = members.length > 0 ? totalAllSavings / members.length : 0;

  return {
    totalPokok,
    totalWajib,
    totalSukarela,
    totalWisata,
    totalAllSavings,
    avgSavings,
  };
}

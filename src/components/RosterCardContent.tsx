import type { RosterMember } from "../domain/types";

export function RosterCardContent({ member }: { member: RosterMember }) {
  const type = member.type.toLowerCase();
  const typeIcon = member.type === "PC" ? "/icons/ui/player.svg" : member.type === "Ally" ? "/icons/ui/ally.svg" : member.type === "Enemy" ? "/icons/ui/enemy.svg" : "/icons/ui/npc.svg";

  return <>
    <span className={`entity-type entity-type--${type} roster-card__type`}>
      <img className="roster-card__entity-icon" src={typeIcon} alt="" />
      <span className="roster-card__selected-icon" aria-hidden="true" />
      <img className="roster-card__remove-icon" src="/icons/ui/close-small.svg" alt="" />
    </span>
    <strong className="roster-card__name">{member.name}</strong>
    <span className="roster-card__stat roster-card__stat--ac"><img src="/icons/ui/shield.svg" alt="" />{member.armorClass}</span>
    <span className="roster-card__stat roster-card__stat--hp"><img src="/icons/ui/heart.svg" alt="" />{member.maxHP}</span>
  </>;
}

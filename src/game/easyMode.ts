import type { Card, GameEvent, GameState } from './types';

const clearEasyUndo = (partial: Partial<GameState>): Partial<GameState> => ({
  ...partial,
  easyUndoState: null,
});

export const createEasyConfirmationEvent = (card: Card, state: GameState): GameEvent => ({
  id: `${card.id}_easy_event`,
  date: { year: state.year, month: state.month },
  title: card.title,
  titleZh: card.titleZh,
  description: card.description,
  descriptionZh: card.descriptionZh,
  options: [
    {
      text: 'Apply Effect',
      textZh: '应用效果',
      effect: (currentState) => {
        const stateBeforeCard = currentState.easyUndoState || currentState;
        return clearEasyUndo(card.effect(stateBeforeCard));
      },
    },
    {
      text: 'Return card to hand (Refund costs)',
      textZh: '将卡牌放回手牌 (返还消耗)',
      effect: (currentState) => ({
        ...(currentState.easyUndoState || currentState),
        easyUndoState: null,
      }),
    },
  ],
});

export const addEasyUndoOption = (event: GameEvent): GameEvent => ({
  ...event,
  options: [
    ...event.options.map((option) => ({
      ...option,
      effect: (state: GameState) => clearEasyUndo(option.effect(state)),
    })),
    {
      text: 'Return card to hand (Refund costs)',
      textZh: '将卡牌放回手牌 (返还消耗)',
      effect: (state: GameState) => ({
        ...(state.easyUndoState || state),
        easyUndoState: null,
      }),
    },
  ],
});

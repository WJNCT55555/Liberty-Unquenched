---
name: Organizational Card Creation
description: Guidelines and templates for creating new Organizational Cards (组织卡牌) in the game.
---

# Organizational Card Creation Guide

This skill provides the template and guidelines for creating new Organizational Cards (组织卡牌) in the game. Organizational cards represent actions the player can take during the Action Phase to manage the CNT-FAI, influence factions, or interact with society.

## 1. File Structure & Location

New organizational cards should be created as individual `.ts` files in the `src/game/action_affairs/` directory. 

After creating the card, it must be exported and added to the `ACTION_AFFAIRS` array in `src/game/action_affairs/index.ts`.

## 2. Card Interface (`Card`)

Every card must implement the `Card` interface defined in `src/game/types.ts`:

```typescript
export interface Card {
  id: string;
  title: string;
  titleZh?: string;
  type: CardType; // For organizational cards, this is ALWAYS 'Organizational'
  description: string;
  descriptionZh?: string;
  cost: number; // Action points required to play the card (usually 1)
  resourceCost?: number; // Optional: Resources required
  armamentCost?: number; // Optional: Armaments required
  condition?: (state: GameState) => boolean; // Optional: When is the card playable?
  effect: (state: GameState) => Partial<GameState>; // The result of playing the card
}
```

## 3. Types of Cards

There are two main patterns for cards:
1. **Direct Effect Cards**: Playing the card immediately changes the game state (e.g., spending resources to gain influence).
2. **Event-Triggering Cards**: Playing the card opens a modal with multiple choices (by setting `currentEvent` in the state).

### Pattern A: Direct Effect Card

This template is for a card that applies its effects immediately without further player input.

```typescript
import { Card, GameState } from '../types';

export const myDirectCard: Card = {
  id: 'my_direct_card',
  title: 'Direct Action',
  titleZh: '直接行动',
  type: 'Organizational',
  description: 'A brief description of what this card does.',
  descriptionZh: '简短描述这张卡牌的作用。',
  cost: 1, // Costs 1 Action Point
  resourceCost: 1, // Costs 1 Resource (optional)
  condition: (state: GameState) => state.resources >= 1, // Must have at least 1 resource
  effect: (state: GameState) => {
    // ALWAYS deep copy nested objects before modifying them!
    const newFactions = JSON.parse(JSON.stringify(state.factions));
    
    // Modify values, ensuring they stay within bounds (0-100)
    newFactions.Faistas.influence = Math.min(100, newFactions.Faistas.influence + 5);
    newFactions.Treintistas.dissent = Math.max(0, newFactions.Treintistas.dissent - 5);

    return {
      // Deduct resources (if not handled automatically by the engine)
      resources: state.resources - 1,
      // Update nested objects
      factions: newFactions,
      // Update flat stats
      stats: {
        ...state.stats,
        socialRevolution: Math.min(100, state.stats.socialRevolution + 2)
      }
    };
  }
};
```

### Pattern B: Event-Triggering Card (Modal Choices)

This template is for a card that opens a dialog with multiple options when played.

```typescript
import { Card, GameState } from '../types';

export const myEventCard: Card = {
  id: 'my_event_card',
  title: 'Strategic Meeting',
  titleZh: '战略会议',
  type: 'Organizational',
  description: 'Call a meeting to decide our next strategic focus.',
  descriptionZh: '召开会议决定我们下一步的战略重心。',
  cost: 1,
  // Optional cooldown timer condition
  // condition: (state) => state.my_custom_timer <= 0, 
  effect: (state: GameState) => ({
    // Set a cooldown timer if needed
    // my_custom_timer: 3, 
    
    // Trigger an event modal
    currentEvent: {
      id: 'my_event_card_decision',
      title: 'Strategic Meeting',
      titleZh: '战略会议',
      description: 'The delegates have gathered. What should we focus on?',
      descriptionZh: '代表们已齐聚一堂。我们应该把重心放在哪里？',
      options: [
        {
          text: 'Focus on Propaganda (+5 Revolution, -1 Resource)',
          textZh: '专注于宣传 (+5 革命热情, -1 资源)',
          condition: (s: GameState) => s.resources >= 1,
          unavailableSubtitleZh: () => '需要至少1资源',
          effect: (s: GameState) => ({
            resources: s.resources - 1,
            stats: {
              ...s.stats,
              socialRevolution: Math.min(100, s.stats.socialRevolution + 5)
            }
          })
        },
        {
          text: 'Focus on Unity (-5 Dissent for all factions)',
          textZh: '专注于团结 (所有派系分歧 -5)',
          effect: (s: GameState) => {
            const newFactions = JSON.parse(JSON.stringify(s.factions));
            Object.keys(newFactions).forEach(faction => {
              newFactions[faction].dissent = Math.max(0, newFactions[faction].dissent - 5);
            });
            return { factions: newFactions };
          }
        }
      ]
    }
  })
};
```

## 4. Best Practices & Rules

1. **Immutability & Deep Copying**: When modifying nested state objects like `factions`, `classes`, or `stats`, **always** create a deep copy first (e.g., `JSON.parse(JSON.stringify(state.factions))`) or use the spread operator carefully. Never mutate `state` directly.
2. **Bounds Checking**: Use `Math.min(100, value)` for upper bounds and `Math.max(0, value)` for lower bounds when modifying percentages like influence, dissent, or support.
3. **Localization**: Always provide both English (`title`, `description`, `text`) and Chinese (`titleZh`, `descriptionZh`, `textZh`) strings.
4. **Conditions**: If an option or card requires resources/armaments, ensure the `condition` function checks for it, and provide an `unavailableSubtitleZh` to explain why it's locked.
5. **Registration**: Don't forget to import and add your new card to the `ACTION_AFFAIRS` array in `src/game/action_affairs/index.ts`.

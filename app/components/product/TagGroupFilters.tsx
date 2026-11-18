import { useTranslation } from '@salla.sa/twilight-theme-engine/i18n';
import type { TagFilterGroup } from '../../lib/tagGroupFilters';

export interface TagGroupFiltersProps {
  groups: TagFilterGroup[];
  selected: readonly string[];
  onToggle: (key: string) => void;
  onClear: () => void;
  className?: string;
}

/**
 * Merchant "Group-Value" tag filters (age range, color, skills — 06 §6): the
 * one thing native `<salla-filters>` can't do, since these are plain product
 * tags rather than a configured attribute. Renders nothing when the currently
 * loaded products carry no such tags.
 */
export function TagGroupFilters({ groups, selected, onToggle, onClear, className }: TagGroupFiltersProps) {
  const { t } = useTranslation();
  if (!groups.length) return null;

  return (
    <div className={`tag-group-filters ${className ?? ''}`}>
      <div className="tag-group-filters__head">
        <h3 className="tag-group-filters__title">
          {t('blocks.catalog.tag_filters_title', 'More filters')}
        </h3>
        {selected.length > 0 && (
          <button type="button" className="tag-group-filters__clear" onClick={onClear}>
            {t('blocks.catalog.clear_filters', 'Clear all')}
          </button>
        )}
      </div>

      {groups.map((group) => (
        <fieldset key={group.group} className="tag-group-filters__group">
          <legend className="tag-group-filters__group-title">{group.group}</legend>
          <div className="tag-group-filters__options">
            {group.options.map((option) => (
              <label key={option.key} className="tag-group-filters__option">
                <input
                  type="checkbox"
                  checked={selected.includes(option.key)}
                  onChange={() => onToggle(option.key)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

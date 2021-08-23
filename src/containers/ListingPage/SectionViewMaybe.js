import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';

// Import css from existing CSS Modules file:
import css from './ListingPage.module.css';

// Create new React component
const SectionViewMaybe = props => {
    const {options, publicData} = props;
    const selectedOption = publicData?.view || null;

    // If public data contains no selected options, return null.
    // This is why component is named ...Maybe.
    if (!publicData || !selectedOption) {
        return null;
    }

    // Find selected options label
    const optionConfig = options.find(o => o.key === selectedOption);
    const optionLabel = optionConfig?.label || null;

    return (
        <div className={css.sectionFeatures}>
            <h2>
                <FormattedMessage
                    id="ListingPage.viewType"
                    values={{ view: optionLabel.toLowerCase() }}
                />
            </h2>

        </div>
    );
};

export default SectionViewMaybe;
import { createNumberMask } from 'text-mask-addons';
import { maskInput } from 'vanilla-text-mask';
import _ from 'lodash';
import { getCurrencyAffixes } from '../../utils/utils';
import NumberComponent from '../number/Number';

export default class CurrencyComponent extends NumberComponent {
  static schema(...extend) {
    return NumberComponent.schema({
      type: 'currency',
      label: 'Currency',
      key: 'currency'
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'Currency',
      group: 'advanced',
      icon: 'usd',
      documentation: 'http://help.form.io/userguide/#currency',
      weight: 70,
      schema: CurrencyComponent.schema()
    };
  }

  constructor(component, options, data) {
    // Currency should default to have a delimiter unless otherwise specified.
    if (component && !component.hasOwnProperty('delimiter')) {
      component.delimiter = true;
    }
    super(component, options, data);
  }

  attachElement(element, index) {
    super.attachElement(element, index);

    this.addEventListener(element, 'blur', () => {
      element.value = this.getValueAsString(this.addZerosAndFormatValue(this.parseValue(element.value)));
    });
  }

  /**
   * Creates the number mask for currency numbers.
   *
   * @return {*}
   */
  createNumberMask() {
    const decimalLimit = _.get(this.component, 'decimalLimit', 2);
    const affixes = getCurrencyAffixes({
      currency: this.component.currency,
      decimalLimit: decimalLimit,
      decimalSeparator: this.decimalSeparator,
      lang: this.options.language
    });
    this.prefix = this.options.prefix || affixes.prefix;
    this.suffix = this.options.suffix || affixes.suffix;
    return createNumberMask({
      prefix: this.prefix,
      suffix: this.suffix,
      thousandsSeparatorSymbol: _.get(this.component, 'thousandsSeparator', this.delimiter),
      decimalSymbol: _.get(this.component, 'decimalSymbol', this.decimalSeparator),
      decimalLimit: decimalLimit,
      allowNegative: _.get(this.component, 'allowNegative', true),
      allowDecimal: _.get(this.component, 'allowDecimal', true)
    });
  }

  setInputMask(input) {
    const affixes = getCurrencyAffixes({
      currency: this.component.currency,
      decimalSeparator: this.decimalSeparator,
      lang: this.options.language,
    });
    let numberPattern = `\\${affixes.prefix}[0-9`;
    numberPattern += this.decimalSeparator || '';
    numberPattern += this.delimiter || '';
    numberPattern += ']*';
    input.setAttribute('pattern', numberPattern);
    input.mask = maskInput({
      inputElement: input,
      mask: this.numberMask || '',
    });
  }

  get defaultSchema() {
    return CurrencyComponent.schema();
  }

  parseNumber(value) {
    return super.parseNumber(this.stripPrefixSuffix(value));
  }

  parseValue(value) {
    return super.parseValue(this.stripPrefixSuffix(value));
  }

  addZerosAndFormatValue(value) {
   if (!value && value !== 0) return;

    const decimalLimit = _.get(this.component, 'decimalLimit', 2);

    let integerPart;
    let decimalPart = '';
    let decimalPartNumbers = [];
    const negativeValueSymbol = '-';
    const hasPrefix = this.prefix ? value.includes(this.prefix) : false;
    const hasSuffix = this.suffix ? value.includes(this.suffix) : false;
    const isNegative = value.includes(negativeValueSymbol) || false;

    value = this.stripPrefixSuffix(isNegative ? value.replace(negativeValueSymbol,'') : value);

    if (value.includes(this.decimalSeparator)) {
      [integerPart, decimalPart] = value.split(this.decimalSeparator);
      decimalPartNumbers =[...decimalPart.split('')] ;
    }
    else {
      integerPart = value;
    }

    if (decimalPart.length < decimalLimit) {
      while (decimalPartNumbers.length < decimalLimit) {
        decimalPartNumbers.push('0');
      }
    }

    const formattedValue = `${isNegative ? negativeValueSymbol:''}${hasPrefix ? this.prefix : ''}${integerPart}${this.decimalSeparator}${decimalPartNumbers.join('')}${hasSuffix ? this.suffix : ''}`;

    return super.formatValue(formattedValue);
  }

  getValueAsString(value, options) {
    const stringValue = super.getValueAsString(value, options);

    // eslint-disable-next-line eqeqeq
    if (value || value == '0') {
      return this.addZerosAndFormatValue(stringValue);
    }

    return stringValue;
  }

  formatValue(value) {
    if (value || value === '0') {
      return this.addZerosAndFormatValue(value);
    }

    return super.formatValue(value);
  }

  stripPrefixSuffix(value) {
    if (typeof value === 'string') {
      try {
        const hasPrefix = this.prefix ? value.includes(this.prefix) : false;
        const hasSuffix = this.suffix ? value.includes(this.suffix) : false;
        const hasDelimiter = value.includes(this.delimiter);
        const hasDecimalSeparator = value.includes(this.decimalSeparator);

        if (this.prefix) {
          value = value.replace(this.prefix, '');
        }
        if (this.suffix) {
          value = value.replace(this.suffix, '');
        }
        //when we enter $ in the field using dashboard, it contains '_' that is NaN
        if ((hasPrefix || hasSuffix) && !hasDelimiter && !hasDecimalSeparator && (Number.isNaN(+value) || !value)) {
          value ='0';
        }
      }
      catch (err) {
        // If value doesn't have a replace method, continue on as before.
      }
    }
    return value;
  }
}

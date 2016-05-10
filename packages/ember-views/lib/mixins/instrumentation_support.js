/**
@module ember
@submodule ember-views
*/
import { Mixin } from 'ember-metal/mixin';

/**
  @class InstrumentationSupport
  @namespace Ember
  @public
*/
var InstrumentationSupport = Mixin.create({
  /**
    Used to identify this view during debugging

    @property instrumentDisplay
    @type String
    @public
  */
  instrumentDisplay: '',

  instrumentName: 'view'
});

export default InstrumentationSupport;

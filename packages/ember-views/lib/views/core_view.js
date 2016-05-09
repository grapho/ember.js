import { get } from 'ember-metal/property_get';

import EmberObject from 'ember-runtime/system/object';
import Evented from 'ember-runtime/mixins/evented';
import ActionHandler, { deprecateUnderscoreActions } from 'ember-runtime/mixins/action_handler';
import { typeOf } from 'ember-runtime/utils';

import { cloneStates, states } from 'ember-views/views/states';

import require from 'require';
import isEnabled from 'ember-metal/features';

import Registry, {
  privatize as P
} from 'container/registry';

/**
  `Ember.CoreView` is an abstract class that exists to give view-like behavior
  to both Ember's main view class `Ember.View` and other classes that don't need
  the fully functionaltiy of `Ember.View`.

  Unless you have specific needs for `CoreView`, you will use `Ember.View`
  in your applications.

  @class CoreView
  @namespace Ember
  @extends Ember.Object
  @deprecated Use `Ember.View` instead.
  @uses Ember.Evented
  @uses Ember.ActionHandler
  @private
*/
const CoreView = EmberObject.extend(Evented, ActionHandler, {
  isView: true,

  _states: cloneStates(states),

  init() {
    this._super(...arguments);
    this._state = 'preRender';
    this._currentState = this._states.preRender;
    this._isVisible = get(this, 'isVisible');

    // Fallback for legacy cases where the view was created directly
    // via `create()` instead of going through the container.
    if (!this.renderer) {
      this.renderer = defaultRenderer();
    }

    this._destroyingSubtreeForView = null;
    this._dispatching = null;
  },

  /**
    If the view is currently inserted into the DOM of a parent view, this
    property will point to the parent of the view.

    @property parentView
    @type Ember.View
    @default null
    @private
  */
  parentView: null,

  instrumentName: 'core_view',

  instrumentDetails(hash) {
    hash.object = this.toString();
    hash.containerKey = this._debugContainerKey;
    hash.view = this;
  },

  /**
    Override the default event firing from `Ember.Evented` to
    also call methods with the given name.

    @method trigger
    @param name {String}
    @private
  */
  trigger() {
    this._super(...arguments);
    var name = arguments[0];
    var method = this[name];
    if (method) {
      var args = new Array(arguments.length - 1);
      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }
      return method.apply(this, args);
    }
  },

  has(name) {
    return typeOf(this[name]) === 'function' || this._super(name);
  },

  destroy() {
    if (!this._super(...arguments)) { return; }

    this._currentState.cleanup(this);

    return this;
  }
});

deprecateUnderscoreActions(CoreView);

CoreView.reopenClass({
  isViewFactory: true
});

function setupGlimmer(registry) {
  let Environment = require('ember-glimmer/environment').default;
  registry.register('service:-glimmer-environment', Environment);
  registry.injection('service:-glimmer-environment', 'dom', 'service:-dom-helper');
  registry.injection('renderer', 'env', 'service:-glimmer-environment');
  let OutletView = require('ember-glimmer/ember-routing-view').OutletView;
  registry.register('view:-outlet', OutletView);
  let { InteractiveRenderer } = require('ember-glimmer/renderer');
  registry.register('renderer:-dom', InteractiveRenderer);
  let DOMHelper = require('ember-glimmer/dom').default;
  registry.register('service:-dom-helper', {
    create() { return new DOMHelper(document); }
  });
  let glimmerOutletTemplate = require('ember-glimmer/templates/outlet').default;
  let glimmerComponentTemplate = require('ember-glimmer/templates/component').default;
  registry.register(P`template:components/-default`, glimmerComponentTemplate);
  registry.register('template:-outlet', glimmerOutletTemplate);
  registry.injection('view:-outlet', 'template', 'template:-outlet');
  registry.injection('template', 'env', 'service:-glimmer-environment');
  registry.optionsForType('helper', { instantiate: false });
}

// Normally, the renderer is injected by the container when the view is looked
// up. However, if someone creates a view without looking it up via the
// container (e.g. `Ember.View.create().append()`) then we create a fallback
// DOM renderer that is shared. In general, this path should be avoided since
// views created this way cannot run in a node environment.
let renderer;
function defaultRenderer() {
  if (!renderer) {
    let DOMHelper;
    let dom;
    let InteractiveRenderer;
    if (isEnabled('ember-glimmer')) {
      let registry = new Registry();
      setupGlimmer(registry);
      let container = registry.container();
      renderer = container.lookup('renderer:-dom');
    } else {
      DOMHelper = require('ember-htmlbars/system/dom-helper').default;
      dom = new DOMHelper();
      InteractiveRenderer = require('ember-htmlbars/renderer').InteractiveRenderer;
      renderer = InteractiveRenderer.create({ dom });
    }
  }
  return renderer;
}

export default CoreView;

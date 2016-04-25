import { assert } from 'ember-metal/debug';
import EmberObject from 'ember-runtime/system/object';
import { getOwner } from 'container/owner';
import require from 'require';

export default EmberObject.extend({
  lookupFactory(name, owner) {
    owner = owner || getOwner(this);

    let fullName = 'component:' + name;
    let templateFullName = 'template:components/' + name;
    let templateRegistered = owner && owner.hasRegistration(templateFullName);

    if (templateRegistered) {
      owner.inject(fullName, 'layout', templateFullName);
    }

    let Component = owner._lookupFactory(fullName);

    // Only treat as a component if either the component
    // or a template has been registered.
    if (templateRegistered || Component) {
      if (!Component) {
        // TODO: need a declaritave way to setup an alias to another factory
        owner.register(fullName, require('ember-templates/component'));
        Component = owner._lookupFactory(fullName);
      }
      return Component;
    }
  },

  componentFor(name, owner, options) {
    assert(`You cannot use '${name}' as a component name. Component names must contain a hyphen.`, ~name.indexOf('-'));

    let fullName = 'component:' + name;
    return owner._lookupFactory(fullName, options);
  },

  layoutFor(name, owner, options) {
    assert(`You cannot use '${name}' as a component name. Component names must contain a hyphen.`, ~name.indexOf('-'));

    let templateFullName = 'template:components/' + name;
    return owner.lookup(templateFullName, options);
  }
});

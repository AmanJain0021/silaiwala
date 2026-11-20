/*
 * react-hook-form on native. The web spreads `{...register('name', rules)}` onto a DOM <input>
 * (uncontrolled, read through a ref). TextInput has no DOM value, so bind the same field as a
 * controlled input: rules are still registered, the value comes from watch(), and every change goes
 * through setValue() with validation — errors and handleSubmit behave like the web.
 *
 * Like register() on the web, a `rules.onChange(e)` handler runs after the value is stored, so
 * sanitisers (digits only, upper-case, …) keep working. A handler may either call setValue itself
 * or mutate `e.target.value` (both web patterns are supported).
 *
 * The returned props work for text inputs (`onChangeText`) and for value pickers such as
 * Select / DateField (`onValueChange`, which those components accept as a fallback for onChange).
 *
 *   const field = rnField(register, watch, setValue);
 *   <Input {...field('email', { required: 'Email is required' })} />
 */
export const rnField = (register, watch, setValue) => (name, rules) => {
  const reg = register(name, rules);
  const value = watch(name);
  const opts = { shouldValidate: true, shouldDirty: true, shouldTouch: true };
  const handle = (v) => {
    setValue(name, v, opts);
    if (typeof rules?.onChange === 'function') {
      const e = { target: { name, value: v }, type: 'change' };
      rules.onChange(e);
      if (e.target.value !== v) setValue(name, e.target.value, opts);
    }
  };
  return {
    name,
    value: value == null ? '' : String(value),
    onChangeText: handle,
    onValueChange: handle,
    onBlur: () => reg.onBlur({ target: { name, value: watch(name) }, type: 'blur' }),
  };
};

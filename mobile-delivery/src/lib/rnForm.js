/*
 * react-hook-form on native. The web spreads `{...register('name', rules)}` onto a DOM <input>
 * (uncontrolled, read through a ref). TextInput has no DOM value, so bind the same field as a
 * controlled input: rules are still registered, the value comes from watch(), and every change goes
 * through setValue() with validation — errors and handleSubmit behave like the web.
 *
 *   const field = rnField(register, watch, setValue);
 *   <Input {...field('email', { required: 'Email is required' })} />
 */
export const rnField = (register, watch, setValue) => (name, rules) => {
  const reg = register(name, rules);
  const value = watch(name);
  return {
    name,
    value: value == null ? '' : String(value),
    onChangeText: (v) => setValue(name, v, { shouldValidate: true, shouldDirty: true, shouldTouch: true }),
    onBlur: () => reg.onBlur({ target: { name, value: watch(name) }, type: 'blur' }),
  };
};

import re

with open('src/components/SandboxMenu.tsx', 'r') as f:
    code = f.read()

# Replace activeCoalition checks with a computed property or something?
# I'll just write a replace for the Sandbox edits.

code = code.replace(
'''state.activeCoalition?.activeId === def.id ? 'bg-ink text-paper border-ink font-bold' : 'border-ink bg-transparent'
                          }`}
                        >
                          {isZh ? def.nameZh : def.name}
                        </button>
                      ))}
                      {state.activeCoalition && (
                        <button 
                          onClick={() => {
                            dispatch({ type: 'SANDBOX_EDIT', payload: { activeCoalition: null } });
                          }}''',
'''(state.activeCoalitions || []).some(c => c.activeId === def.id) ? 'bg-ink text-paper border-ink font-bold' : 'border-ink bg-transparent'
                          }`}
                        >
                          {isZh ? def.nameZh : def.name}
                        </button>
                      ))}
                      {state.activeCoalitions && state.activeCoalitions.length > 0 && (
                        <button 
                          onClick={() => {
                            dispatch({ type: 'SANDBOX_EDIT', payload: { activeCoalitions: [], rulingCoalition: null } });
                          }}'''
)

code = code.replace('state.activeCoalition ? (', 'state.activeCoalitions && state.activeCoalitions.length > 0 ? (() => { const activeCoalition = state.activeCoalitions.find(c => c.activeId === state.rulingCoalition) || state.activeCoalitions[0]; return (')

code = code.replace('state.activeCoalition.', 'activeCoalition.')
code = code.replace('state.activeCoalition!', 'activeCoalition')
code = code.replace(
'''payload: { 
                                  activeCoalition: { 
                                    ...activeCoalition, 
                                    cohesion: cohesionVal 
                                  } 
                                }''',
'''payload: { 
                                  activeCoalitions: state.activeCoalitions.map(c => c.activeId === activeCoalition.activeId ? { ...c, cohesion: cohesionVal } : c)
                                }'''
)

code = code.replace(
'''payload: { 
                                  activeCoalition: { 
                                    ...activeCoalition, 
                                    cntAttitude: attVal 
                                  } 
                                }''',
'''payload: { 
                                  activeCoalitions: state.activeCoalitions.map(c => c.activeId === activeCoalition.activeId ? { ...c, cntAttitude: attVal } : c)
                                }'''
)

code = code.replace(
'''}
                      </div>
                    ) : (''',
'''}
                      </div>
                    )})() : ('''
)

with open('src/components/SandboxMenu.tsx', 'w') as f:
    f.write(code)

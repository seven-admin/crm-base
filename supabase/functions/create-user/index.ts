import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to copy permissions from a base role to a target role
async function copyPermissionsFromBaseRole(
  supabaseAdmin: any,
  baseRoleId: string,
  targetRoleId: string
): Promise<void> {
  // Get all permissions from base role
  const { data: basePerms, error: baseError } = await supabaseAdmin
    .from('role_permissions')
    .select('*')
    .eq('role_id', baseRoleId);

  if (baseError || !basePerms || basePerms.length === 0) {
    console.log('No base permissions found to copy');
    return;
  }

  // Create new permissions for target role
  const newPerms = basePerms.map((perm: any) => ({
    role_id: targetRoleId,
    module_id: perm.module_id,
    can_view: perm.can_view,
    can_create: perm.can_create,
    can_edit: perm.can_edit,
    can_delete: perm.can_delete,
    scope: perm.scope
  }));

  const { error: insertError } = await supabaseAdmin
    .from('role_permissions')
    .insert(newPerms);

  if (insertError) {
    console.error('Error copying permissions:', insertError);
    throw insertError;
  }

  console.log(`Copied ${newPerms.length} permissions from base role to target role`);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Authorization header missing')
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    if (!token || token === 'undefined' || token === 'null') {
      console.error('Invalid token:', token)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Validating token...')
    
    // Use admin client to get user from token
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError) {
      console.error('Auth error:', authError.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + authError.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const caller = userData?.user
    if (!caller) {
      console.error('No user found in token')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', caller.id, caller.email)

    // Check if caller is admin or super_admin (using role_id + roles table)
    const { data: callerRoleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, roles!inner(name)')
      .eq('user_id', caller.id)
      .single()

    if (roleError) {
      console.error('Error fetching role:', roleError)
    }

    const callerRoleName = (callerRoleData?.roles as any)?.name
    if (!callerRoleName || !['admin', 'super_admin'].includes(callerRoleName)) {
      console.error('Caller is not admin:', callerRoleName)
      return new Response(
        JSON.stringify({ error: 'Only admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { 
      email, 
      full_name, 
      phone, 
      role, 
      is_active = true, 
      tipo_vinculo = 'terceiro', 
      cargo = null,
      base_role_id = null 
    } = await req.json()

    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, full_name, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating user:', { email, full_name, role })

    // Default password - user should change on first login
    const defaultPassword = 'Seven@1234'

    // Create user in Auth
    let newUserId: string

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    })

    if (createError) {
      // Handle "email already registered" gracefully
      if (createError.message.includes('already been registered')) {
        console.log('Email already registered, looking up existing user:', email)
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (listError) {
          console.error('Error listing users:', listError)
          return new Response(
            JSON.stringify({ error: 'Failed to look up existing user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const existingUser = listData.users.find((u: any) => u.email === email)
        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: 'User reportedly exists but could not be found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        newUserId = existingUser.id
        console.log('Found existing user:', newUserId)
      } else {
        console.error('Error creating auth user:', createError)
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      newUserId = authData.user.id
      console.log('User created in auth:', newUserId)
    }

    // Update profile (created by trigger) with additional info
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        phone: phone || null,
        is_active,
        tipo_vinculo,
        cargo: tipo_vinculo === 'funcionario_seven' ? cargo : null
      })
      .eq('id', newUserId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Get the role_id from the roles table based on role name
    const { data: roleData, error: roleQueryError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', role)
      .single()

    if (roleQueryError || !roleData) {
      console.error('Error finding role:', roleQueryError)
      return new Response(
        JSON.stringify({ error: 'Role not found: ' + role }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the role has any permissions configured
    const { count: permCount } = await supabaseAdmin
      .from('role_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleData.id)

    console.log(`Role ${role} has ${permCount} permissions configured`)

    // If role has no permissions and a base_role_id was provided, copy permissions
    if ((permCount === 0 || permCount === null) && base_role_id) {
      console.log(`Copying permissions from base role ${base_role_id} to ${roleData.id}`)
      try {
        await copyPermissionsFromBaseRole(supabaseAdmin, base_role_id, roleData.id)
      } catch (copyError) {
        console.error('Failed to copy permissions:', copyError)
        // Continue anyway - user will just have no permissions
      }
    }

    // Check if user already has this role before inserting
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', newUserId)
      .eq('role_id', roleData.id)
      .maybeSingle()

    if (!existingRole) {
      const { error: insertRoleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUserId,
          role_id: roleData.id
        })

      if (insertRoleError) {
        console.error('Error inserting role:', insertRoleError)
        return new Response(
          JSON.stringify({ error: 'User created but failed to assign role: ' + insertRoleError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      console.log('User already has this role, skipping insert')
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email
    })

    if (resetError) {
      console.log('Could not send reset email:', resetError)
    }

    console.log('User created successfully:', newUserId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: newUserId,
        message: 'Usuário criado com sucesso. Senha inicial: Seven@1234 (alterar no primeiro acesso)'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

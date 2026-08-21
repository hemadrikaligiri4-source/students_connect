package app.studyloop.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Value("${supabase.jwt.secret:}")
    private String jwtSecret;

    @Value("${supabase.jwt.verify-signature:false}")
    private boolean verifySignature;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                UserPrincipal principal = parseToken(jwt);
                if (principal != null) {
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            principal, null, principal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private UserPrincipal parseToken(String token) {
        try {
            if (verifySignature && StringUtils.hasText(jwtSecret)) {
                // Verify signature using the HS256 key
                Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(key)
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                String userIdStr = claims.getSubject();
                String email = claims.get("email", String.class);
                String role = claims.get("role", String.class);
                if (role == null) role = "authenticated";

                return UserPrincipal.builder()
                        .id(UUID.fromString(userIdStr))
                        .email(email)
                        .role(role)
                        .build();
            } else {
                // Parse claims without signature verification (base64 decoding)
                String[] parts = token.split("\\.");
                if (parts.length >= 2) {
                    String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
                    Map<String, Object> claims = objectMapper.readValue(payloadJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});

                    String userIdStr = (String) claims.get("sub");
                    String email = (String) claims.get("email");
                    String role = (String) claims.get("role");
                    if (role == null) role = "authenticated";

                    if (userIdStr != null && email != null) {
                        return UserPrincipal.builder()
                                .id(UUID.fromString(userIdStr))
                                .email(email)
                                .role(role)
                                .build();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse JWT token: {}", e.getMessage());
        }
        return null;
    }
}
